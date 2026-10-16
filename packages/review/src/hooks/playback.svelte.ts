import { untrack } from "svelte";
import type { JobStatus, ReviewModel } from "#src/core/types.js";
import { createFilePlayer } from "#src/hooks/player.svelte.js";
import { createLivePlayer } from "#src/hooks/live-player.svelte.js";
import type { Playback } from "#src/hooks/playback.js";

/** The cut pass plays the edit itself. */
export const LIVE_PASS = "cut";

/** What holds the player back, in the words for it. */
export type Gate = {
  /** The job the player waits on: the take proxies in the cut pass, the preview render everywhere else. */
  job: JobStatus | undefined;
  /** Nothing can play. */
  locks: boolean;
  /** The cover says it's working. A failed job locks the player and says so instead. */
  working: boolean;
  /** Overrides the cover's words while it works. */
  say?: string;
  /** What the cover says when the job failed. The job's own error is for the agent, which reads it from the studio, never the page. */
  failed: string;
};

const WORDS = {
  live: "Getting the preview ready",
  failedLive: "The preview couldn't load. Your agent can fix it.",
  failedFile: "Your video couldn't update. Your agent can fix it.",
};

/**
 * Picks who plays the cut, in one place. Every pass plays the rendered preview, layers and all. The cut
 * pass falls back to the play-list player only while that preview is behind the edit and the take
 * proxies are ready, so a cut shows at once instead of behind a lock. The page talks to `current` only.
 */
export function usePlayback(
  getModel: () => ReviewModel | null,
  getPass: () => string | undefined,
  ratio?: number,
) {
  const file = createFilePlayer(ratio);
  const live = createLivePlayer(ratio);
  const plan = $derived.by(() => {
    const model = getModel();
    if (getPass() !== LIVE_PASS || !model?.player?.live) return undefined;
    if (model.render?.preview.state === "current") return undefined;
    return model.render?.live.state === "current" ? model.player.live : undefined;
  });
  const current = $derived<Playback>(plan ? live : file);

  $effect(() => {
    const model = getModel();
    if (model?.player) file.follow(model.player.src, model.player.poster, model.render?.preview.state);
  });
  $effect(() => {
    if (plan) live.follow(plan);
  });

  // Switching players keeps the playhead where it was, and keeps playing if it was playing: a render
  // finishing mid-play swaps the cut pass from the takes to the preview without stopping it.
  let last: Playback = file;
  $effect(() => {
    const next = current;
    untrack(() => {
      if (next === last) return;
      const playing = !last.paused;
      next.seek(last.time);
      last.pause();
      last = next;
      if (playing) next.toggle();
    });
  });

  const gate = $derived.by<Gate>(() => {
    const model = getModel();
    const render = model?.render;
    const proxies = render?.live;
    if (plan) return { job: proxies, locks: false, working: false, say: WORDS.live, failed: WORDS.failedLive };
    const job = render?.preview;
    const rendering = job?.state === "queued" || job?.state === "rendering";
    const preview: Gate = { job, locks: rendering, working: rendering, failed: WORDS.failedFile };
    if (getPass() !== LIVE_PASS || !model?.player?.live || rendering || job?.state === "current") return preview;
    // The cut pass with no current preview waits on the take proxies, and says so, rather than sit black.
    const building = proxies?.state === "queued" || proxies?.state === "rendering" || proxies?.state === "outdated";
    if (building) return { job: proxies, locks: true, working: true, say: WORDS.live, failed: WORDS.failedLive };
    // Proxies that failed only block the pass when there's no earlier preview to play instead.
    if (proxies?.state === "failed" && (!model.player.src || job?.state === "failed"))
      return { job: proxies, locks: true, working: false, failed: WORDS.failedLive };
    return preview;
  });

  return {
    get current() {
      return current;
    },
    get gate() {
      return gate;
    },
  };
}

export type PlaybackHook = ReturnType<typeof usePlayback>;
