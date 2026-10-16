/** An in-memory adapter over the fixtures, so the real HTTP handler is what the page talks to. */
import { readFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isOpenBeat } from "#src/core/beats.js";
import type {
  ActionResult,
  Pass,
  ReviewAction,
  ReviewAdapter,
  ReviewModel,
} from "#src/core/types.js";
import { ReviewError } from "#src/server/errors.js";
import { addNote, applyNoteAct, applyReply } from "#src/server/notes.js";

const here = dirname(fileURLToPath(import.meta.url));
const MEDIA = join(here, "fixtures", "media");

type Fixture = { root: string; model: ReviewModel };
const FILES: Record<string, string> = {
  "a19-ai-project-manager": "a19.json",
  "shorts-demo": "shorts.json",
};

export const FIXTURE_IDS = Object.keys(FILES);

export function createDevAdapter(base: string) {
  const state = new Map<string, Fixture>();
  const watchers = new Map<string, Set<() => void>>();

  function fixture(id: string): Fixture {
    const found = state.get(id);
    if (found) return found;
    const file = FILES[id];
    if (!file) throw new ReviewError(`No video called ${id}.`);
    const loaded = JSON.parse(readFileSync(join(here, "fixtures", file), "utf8")) as Fixture;
    state.set(id, loaded);
    return loaded;
  }

  const changed = (id: string) => watchers.get(id)?.forEach((fn) => fn());

  /** Pass counts come from the beats, the way a real adapter would work them out. */
  function recount(model: ReviewModel): Pass[] {
    return model.passes.map((pass) => {
      if (pass.view === "music")
        return { ...pass, open: model.music?.decision === "undecided" ? 1 : 0 };
      if (pass.view === "beats" || pass.kinds) {
        const open = model.beats.filter(
          (b) => pass.kinds?.includes(b.kind) && isOpenBeat(b),
        ).length;
        return { ...pass, open };
      }
      return pass;
    });
  }

  /** `media:` placeholders become URLs the handler serves. */
  function withUrls(id: string, model: ReviewModel): ReviewModel {
    const url = (src: string | undefined) =>
      src?.startsWith("media:")
        ? `${base}/${id}/media?file=${encodeURIComponent(src.slice(6))}`
        : src;
    return {
      ...model,
      passes: recount(model),
      beats: model.beats.map((b) => ({
        ...b,
        options: b.options.map((o) => ({ ...o, src: url(o.src) })),
      })),
      ...(model.music
        ? {
            music: {
              ...model.music,
              options: model.music.options.map((o) => ({ ...o, src: url(o.src) })),
            },
          }
        : {}),
      ...(model.player ? { player: { ...model.player, src: url(model.player.src) ?? "" } } : {}),
    };
  }

  const adapter: ReviewAdapter = {
    async load(id) {
      return withUrls(id, structuredClone(fixture(id).model));
    },
    async library(id) {
      fixture(id);
      const clip = `${base}/${id}/media?file=shorts.mp4`;
      return [
        {
          id: "motion",
          label: "Motion",
          items: [
            { id: "pop-in", name: "Pop in", src: clip, meta: "Punchy, 0.4s" },
            { id: "slide-up", name: "Slide up", src: clip, meta: "Soft, 0.6s" },
            { id: "lower-third", name: "Lower third", src: clip, meta: "Name and role" },
          ],
        },
        {
          id: "layout",
          label: "Layouts",
          items: [
            { id: "cam", name: "Camera full", meta: "One box" },
            { id: "split", name: "Screen and camera", meta: "Two boxes" },
          ],
        },
        {
          id: "broll",
          label: "B-roll",
          items: [
            { id: "desk", name: "Desk, top down", src: clip, meta: "Stock, 6s" },
            { id: "whiteboard", name: "Whiteboard wipe", src: clip, meta: "Stock, 4s" },
          ],
        },
      ];
    },
    async act(id, action: ReviewAction): Promise<ActionResult> {
      const { model } = fixture(id);
      switch (action.type) {
        case "decide": {
          const beat = model.beats.find((b) => b.id === action.beat);
          if (!beat) return { ok: false, error: `No beat ${action.beat}.` };
          beat.state = action.state;
          if (action.pick) beat.pick = action.pick;
          break;
        }
        case "music": {
          if (!model.music) return { ok: false, error: "No music here." };
          if ("keep" in action) Object.assign(model.music, { decision: "kept", keep: action.keep });
          else if ("skip" in action)
            Object.assign(model.music, { decision: "skipped", keep: undefined });
          else model.music.more = true;
          break;
        }
        case "note": {
          const owner =
            action.target.kind === "beat"
              ? model.passes.find((p) =>
                  p.kinds?.includes(
                    model.beats.find((b) => b.id === (action.target as { beat: string }).beat)
                      ?.kind ?? "",
                  ),
                )
              : undefined;
          const result = addNote(model.notes, action, owner ? { pass: owner.id } : {});
          if (!result.ok) return result;
          model.notes = result.notes;
          break;
        }
        case "note.act": {
          const result = applyNoteAct(model.notes, action.note, action.act);
          if (!result.ok) return result;
          model.notes = result.notes;
          break;
        }
        case "note.reply": {
          const result = applyReply(model.notes, action.note, action.text);
          if (!result.ok) return result;
          model.notes = result.notes;
          break;
        }
        case "refresh":
          break;
      }
      queueMicrotask(() => changed(id));
      return { ok: true };
    },
    media(id, file) {
      const { root } = fixture(id);
      const clean = normalize(file).replace(/^(\.\.[/\\])+/, "");
      const local = file.startsWith("music/")
        ? join(MEDIA, clean.slice(6))
        : file === "shorts.mp4"
          ? join(MEDIA, "shorts.mp4")
          : root
            ? resolve(root, clean)
            : null;
      if (!local) return null;
      const allowed = file.startsWith("music/") || file === "shorts.mp4" ? MEDIA : root;
      return local.startsWith(resolve(allowed) + "/") || local === resolve(allowed) ? local : null;
    },
    watch(id, fn) {
      const set = watchers.get(id) ?? new Set();
      set.add(fn);
      watchers.set(id, set);
      return () => set.delete(fn);
    },
  };
  return Object.assign(adapter, {
    /** Back to the fixtures as they were on disk, for tests that change things. */
    reset() {
      state.clear();
      for (const id of watchers.keys()) changed(id);
    },
  });
}
