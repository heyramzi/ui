import { getContext, setContext, tick } from "svelte";
import { ownerOf } from "#src/core/beats.js";
import { isClickable } from "#src/core/passes.js";
import { isSettled, STAGE_ORDER, stageOf, type Stage } from "#src/core/notes.js";
import type { ReviewClient } from "#src/client/http.js";
import type { Note, NoteTarget } from "#src/core/types.js";
import { createCompose } from "#src/hooks/compose.svelte.js";
import { createLibrary } from "#src/hooks/library.svelte.js";
import { useTheme } from "#src/hooks/theme.svelte.js";
import { useKeys } from "#src/hooks/keys.svelte.js";
import { usePanels } from "#src/hooks/panels.svelte.js";
import { usePass } from "#src/hooks/pass.svelte.js";
import { usePlayback } from "#src/hooks/playback.svelte.js";
import { createZoom } from "#src/hooks/zoom.svelte.js";
import { createReview } from "#src/hooks/review.svelte.js";
import { useTextSelection } from "#src/hooks/selection.svelte.js";

export type AppOptions = { client: ReviewClient; backHref: string; ratio?: number };

const KEY = Symbol("review-app");

/** Every hook, wired to each other once, so no component has to know how another one works. */
export function createApp({ client, backHref, ratio }: AppOptions) {
  const review = createReview(client);
  const library = createLibrary(client);
  const pass = usePass(() => review.model);
  const panels = usePanels();
  const theme = useTheme();
  const playback = usePlayback(
    () => review.model,
    () => pass.selected?.id,
    ratio,
  );
  const zoom = createZoom();
  let root = $state.raw<HTMLElement | null>(null);
  const keys = useKeys(() => root);
  const selection = useTextSelection(() => root);

  let beatId = $state<string | undefined>();
  let activeNote = $state<string | undefined>();
  let stage = $state<Stage | undefined>();
  let keysOpen = $state(false);
  let showRemovedText = $state(false);
  let pinning = $state(false);

  const compose = createCompose((): NoteTarget => {
    const model = review.model;
    if (
      pass.selected?.view === "beats" &&
      beatId &&
      model?.beats.some((beat) => beat.id === beatId)
    ) {
      return { kind: "beat", beat: beatId };
    }
    if (model?.player) return { kind: "time", at: Math.round(playback.current.time * 10) / 10 };
    return { kind: "video" };
  });

  $effect(() => {
    void review.start();
    void library.ensure();
    return () => review.stop();
  });

  const counts = $derived.by<Record<Stage, number>>(() => {
    const out: Record<Stage, number> = { needs: 0, agents: 0, done: 0 };
    for (const note of review.model?.notes ?? []) out[stageOf(note)] += 1;
    return out;
  });

  /** The tab shown: the one picked, else the first with something in it. */
  const activeStage = $derived<Stage>(
    stage ?? STAGE_ORDER.find((name) => name !== "done" && counts[name] > 0) ?? "needs",
  );

  async function scrollTo(selector: string): Promise<void> {
    await tick();
    const found = root?.querySelector<HTMLElement>(selector);
    found?.scrollIntoView({
      block: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    found?.focus({ preventScroll: true });
  }

  /** Bring whatever a note is about into view. */
  function reveal(note: Note): void {
    activeNote = note.id;
    const model = review.model;
    const target = note.target;
    if (!model) return;
    if (target.kind === "beat") {
      const beat = model.beats.find((item) => item.id === target.beat);
      const owner = beat ? ownerOf(model, beat.kind) : undefined;
      if (owner && isClickable(owner) && pass.selected?.id !== owner.id) pass.select(owner.id);
      beatId = target.beat;
      void scrollTo(`[data-beat="${CSS.escape(target.beat)}"]`);
    } else if (target.kind === "time") {
      playback.current.seek(target.at);
    } else if (target.kind === "text") {
      void scrollTo(`[data-line][data-at="${CSS.escape(target.from)}"]`);
    }
  }

  return {
    backHref,
    /** The shape the host promised, so the skeleton can draw the stage before the model says there is one. */
    ratio,
    review,
    pass,
    panels,
    theme,
    playback,
    /** Whoever plays the cut now: the page asks it, and never which one it is. */
    get player() {
      return playback.current;
    },
    zoom,
    keys,
    selection,
    compose,
    library,
    reveal,
    scrollTo,
    get root() {
      return root;
    },
    set root(element: HTMLElement | null) {
      root = element;
    },
    get beatId() {
      return beatId;
    },
    set beatId(id: string | undefined) {
      beatId = id;
    },
    get activeNote() {
      return activeNote;
    },
    set activeNote(id: string | undefined) {
      activeNote = id;
    },
    get stage() {
      return activeStage;
    },
    set stage(value: Stage) {
      stage = value;
    },
    get counts() {
      return counts;
    },
    get notes() {
      return review.model?.notes ?? [];
    },
    get keysOpen() {
      return keysOpen;
    },
    set keysOpen(value: boolean) {
      keysOpen = value;
    },
    /** The video is waiting for a click or a drag to pin a spot. */
    get pinning() {
      return pinning;
    },
    set pinning(value: boolean) {
      pinning = value;
    },
    get showRemovedText() {
      return showRemovedText;
    },
    set showRemovedText(value: boolean) {
      showRemovedText = value;
    },
    /** Notes still waiting on someone, per pass, for the rail badge. */
    openNotes(id: string): number {
      return (review.model?.notes ?? []).filter((note) => note.pass === id && !isSettled(note))
        .length;
    },
  };
}

export type App = ReturnType<typeof createApp>;

export const provideApp = (app: App): App => setContext(KEY, app);
export const useApp = (): App => {
  const app = getContext<App | undefined>(KEY);
  if (!app) throw new Error("useApp() must be called inside the review page.");
  return app;
};
