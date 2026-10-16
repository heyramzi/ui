import { untrack } from "svelte";
import { previewToShow } from "#src/core/draft.js";
import type { JobStatus } from "#src/core/types.js";
import type { Playback } from "#src/hooks/playback.js";
import { claim } from "#src/ui/media.js";

/** The single-file player: one rendered preview, `cut.review.mp4`, on its own clock. Every pass but the cut plays it. */
export function createFilePlayer(shape = 16 / 9) {
  let video = $state.raw<HTMLVideoElement | null>(null);
  let time = $state(0);
  let duration = $state(0);
  let paused = $state(true);
  // WHY seeded: the file's own size only arrives with its metadata, and a Short drawn 16:9 until then jumps.
  let portrait = $state(shape < 1);
  let ratio = $state(shape);
  let loading = $state(false);
  let locked = $state(false);
  /** The preview file on screen. A re-render's new file waits until the studio says it's ready, then swaps in at the same moment. */
  let shown = $state<string | undefined>();
  let poster: string | undefined;
  /** A seek asked for before a video was there. */
  let start = 0;
  let frame = 0;

  const tick = () => {
    if (video) time = video.currentTime;
    if (video && !video.paused) frame = requestAnimationFrame(tick);
  };

  /**
   * The stage mounts from an `$effect`, and `mountIn` reads `shown`. Tracked, every preview swap would
   * tear the `<video>` down and build a fresh one at 0, paused. `untrack` ties the effect to its host alone.
   */
  const mount = (host: HTMLElement): (() => void) => untrack(() => mountIn(host));

  function mountIn(host: HTMLElement): () => void {
    const element = document.createElement("video");
    element.preload = "metadata";
    element.playsInline = true;
    if (poster) element.poster = poster;
    if (shown) element.src = shown;
    video = element;
    const sync = () => {
      duration = Number.isFinite(element.duration) ? element.duration : 0;
      if (element.videoWidth) portrait = element.videoHeight > element.videoWidth;
      paused = element.paused;
      time = element.currentTime;
    };
    const play = () => {
      // A draft that's out of date can't play, whoever asked: a key, a click, a note's jump.
      if (locked) return element.pause();
      claim(element);
      paused = false;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const pause = () => {
      paused = true;
      time = element.currentTime;
    };
    const measured = () => {
      sync();
      if (element.videoHeight) ratio = element.videoWidth / element.videoHeight;
      if (start > 0) element.currentTime = Math.min(start, element.duration || start);
      start = 0;
    };
    const drawn = () => (loading = false);
    element.addEventListener("loadedmetadata", measured);
    element.addEventListener("durationchange", sync);
    element.addEventListener("seeked", sync);
    element.addEventListener("timeupdate", sync);
    element.addEventListener("play", play);
    element.addEventListener("pause", pause);
    element.addEventListener("loadeddata", drawn);
    element.addEventListener("error", drawn);
    host.append(element);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      element.remove();
      element.removeAttribute("src");
      element.load();
      video = null;
    };
  }

  return {
    mount,
    /** The preview the studio has on disk, and what its render is doing. A new file waits out a running render. */
    follow(src: string | undefined, cover: string | undefined, render: JobStatus["state"] | undefined) {
      poster = cover;
      if (video) video.poster = cover ?? "";
      const next = previewToShow(shown, src, render);
      if (next === shown) return;
      const el = video;
      if (el?.currentSrc) {
        loading = true;
        const at = el.currentTime;
        const resume = !el.paused;
        el.addEventListener(
          "loadedmetadata",
          () => {
            el.currentTime = Math.min(at, el.duration || at);
            if (resume) void el.play().catch(() => undefined);
          },
          { once: true },
        );
      }
      shown = next;
      if (el && next) el.src = next;
    },
    get time() {
      return time;
    },
    get duration() {
      return duration;
    },
    get paused() {
      return paused;
    },
    get portrait() {
      return portrait;
    },
    get ratio() {
      return ratio;
    },
    get ready() {
      return video !== null;
    },
    get loading() {
      return loading;
    },
    get waveform() {
      return shown;
    },
    seek(seconds: number) {
      if (!video) {
        start = Math.max(seconds, 0);
        time = start;
        return;
      }
      video.currentTime = Math.min(Math.max(seconds, 0), duration || seconds);
      time = video.currentTime;
    },
    get locked() {
      return locked;
    },
    lock(on: boolean) {
      locked = on;
      if (on) video?.pause();
    },
    toggle() {
      if (!video || locked) return;
      if (video.paused) void video.play().catch(() => undefined);
      else video.pause();
    },
    pause() {
      video?.pause();
    },
  } satisfies Playback & { follow: unknown };
}

export type FilePlayer = ReturnType<typeof createFilePlayer>;
