import { untrack } from "svelte";
import {
  locate,
  nextJump,
  outputAt,
  playlist,
  relocate,
  type Playlist,
  type Spot,
} from "#src/core/clock.js";
import type { LivePlan } from "#src/core/types.js";
import type { Playback } from "#src/hooks/playback.js";
import { claim } from "#src/ui/media.js";

/** One `<video>`, and the piece of the cut it is holding. */
type Slot = { el: HTMLVideoElement; piece: number | null; seeking?: () => void };

/**
 * Plays the cut from edit.json with two stacked `<video>`s, one playing and one parked at the next
 * piece, so a jump is a swap, across takes or inside one.
 */
export function createLivePlayer(shape = 16 / 9) {
  let list = $state.raw<Playlist>({ pieces: [], duration: 0 });
  let urls: Record<string, string> = {};
  let fps = 30;
  let slots: Slot[] = [];
  /** Which slot is on screen, and which piece it plays. */
  let cur = 0;
  let index = 0;
  let time = $state(0);
  let paused = $state(true);
  // WHY seeded: the take's own size only arrives with its metadata, the same as the file player.
  let portrait = $state(shape < 1);
  let ratio = $state(shape);
  let loading = $state(false);
  let locked = $state(true);
  let mounted = $state(false);
  /** The proxies are loaded for the current plan. A lock clears it, since the take's proxy may have been rebuilt. */
  let loaded = false;
  let frame = 0;

  const on = (): Slot => slots[cur] as Slot;
  const wait = (): Slot => slots[1 - cur] as Slot;

  /** Points a slot at a second of a take, loading the take's proxy when it holds another. A new proxy stops a playing video, so `resume` plays it on. */
  function aim(slot: Slot, source: string, seconds: number, piece: number, resume = false): void {
    const { el } = slot;
    const url = urls[source] as string;
    slot.piece = piece;
    if (slot.seeking) el.removeEventListener("loadedmetadata", slot.seeking);
    if (el.getAttribute("src") !== url) {
      el.src = url;
      if (resume) void el.play().catch(() => undefined);
    }
    const seek = () => {
      el.currentTime = seconds;
      slot.seeking = undefined;
    };
    if (el.readyState >= 1) seek();
    else {
      slot.seeking = seek;
      el.addEventListener("loadedmetadata", seek, { once: true });
    }
  }

  const show = (): void => {
    on().el.style.visibility = "visible";
    wait().el.style.visibility = "hidden";
  };

  /** The standby slot goes to the start of the piece after this one. */
  function prepare(): void {
    const next = nextJump(list, index);
    const slot = wait();
    slot.el.pause();
    if (next) aim(slot, next.source, next.seconds, next.index);
    else slot.piece = null;
  }

  /** Puts a spot of the cut on screen, playing on if it was playing. */
  function enter(spot: Spot): void {
    index = spot.index;
    const holds = (slot: Slot): boolean => slot.el.getAttribute("src") === urls[spot.source];
    // The take is already loaded in the waiting slot, so a seek there is a swap and no proxy reloads.
    if (!holds(on()) && holds(wait())) {
      aim(wait(), spot.source, spot.seconds, spot.index);
      on().el.pause();
      cur = 1 - cur;
      if (!paused)
        void on()
          .el.play()
          .catch(() => undefined);
    } else aim(on(), spot.source, spot.seconds, spot.index, !paused);
    show();
    time = outputAt(list, spot.index, spot.seconds);
    prepare();
  }

  /** The piece in hand ended: the next one takes the screen, or the cut is over. */
  function advance(): void {
    const jump = nextJump(list, index);
    if (!jump) {
      on().el.pause();
      paused = true;
      time = list.duration;
      return;
    }
    const from = on();
    from.el.pause();
    cur = 1 - cur;
    index = jump.index;
    const to = on();
    if (to.piece !== jump.index) aim(to, jump.source, jump.seconds, jump.index);
    show();
    void to.el.play().catch(() => undefined);
    prepare();
  }

  /** A frame or two of slack: the swap starts half a frame before the range's end, while its last frame is still up. */
  const check = (): void => {
    const piece = list.pieces[index];
    if (!piece || paused) return;
    const at = on().el.currentTime;
    if (at >= piece.end - 0.5 / fps) advance();
    else time = outputAt(list, index, at);
  };

  const tick = () => {
    frame = 0;
    if (paused) return;
    check();
    if (!paused) frame = requestAnimationFrame(tick);
  };

  const run = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  /** The plan or the lock moved: load the proxies, or carry the plan change onto what's playing. */
  function refresh(previous?: Playlist): void {
    if (!mounted || locked || list.pieces.length === 0) return;
    if (!loaded) {
      loaded = true;
      loading = true;
      const spot = locate(list, time);
      if (spot) enter(spot);
      return;
    }
    const piece = previous?.pieces[index];
    // Playing: stay on the same moment of the take, so a note never makes the picture jump.
    if (!paused && piece) {
      const spot = relocate(list, piece.source, on().el.currentTime);
      if (spot) {
        index = spot.index;
        prepare();
        return;
      }
    }
    const spot = locate(list, time);
    if (spot) enter(spot);
  }

  /**
   * Untracked because mounting writes the state it reads, so a tracked `$effect` would remount
   * without end and the cover would never lift.
   */
  const mount = (host: HTMLElement): (() => void) => untrack(() => mountIn(host));

  function mountIn(host: HTMLElement): () => void {
    const made = [0, 1].map((): Slot => {
      const el = document.createElement("video");
      el.preload = "auto";
      el.playsInline = true;
      return { el, piece: null };
    });
    slots = made;
    cur = 0;
    const live = (event: Event) => event.target === on().el;
    const cleanups = made.flatMap(({ el }) => {
      const handlers: [string, (event: Event) => void][] = [
        [
          "loadedmetadata",
          () => {
            if (el.videoWidth) {
              portrait = el.videoHeight > el.videoWidth;
              ratio = el.videoWidth / el.videoHeight;
            }
          },
        ],
        ["loadeddata", (event) => live(event) && (loading = false)],
        ["error", () => (loading = false)],
        [
          "play",
          (event) => {
            if (!live(event)) return;
            if (locked) return el.pause();
            claim(el);
            paused = false;
            run();
          },
        ],
        [
          "pause",
          (event) => {
            // A range that plays to its take's end pauses on its own, and the jump is next.
            if (live(event) && !el.ended) paused = true;
          },
        ],
        ["ended", (event) => live(event) && !paused && advance()],
        ["timeupdate", (event) => live(event) && check()],
      ];
      for (const [name, handler] of handlers) el.addEventListener(name, handler);
      return () => handlers.forEach(([name, handler]) => el.removeEventListener(name, handler));
    });
    made.forEach(({ el }) => {
      el.style.gridArea = "1 / 1";
      host.append(el);
    });
    show();
    mounted = true;
    refresh();
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      cleanups.forEach((off) => off());
      for (const { el } of made) {
        el.pause();
        el.remove();
        el.removeAttribute("src");
        el.load();
      }
      slots = [];
      mounted = false;
      loaded = false;
      paused = true;
    };
  }

  return {
    mount,
    /**
     * Untracked like `mount`, because `refresh` reads `time`, and a tracked read reran the `$effect`
     * every frame of playback, seeking both videos each time.
     */
    follow(plan: LivePlan) {
      untrack(() => {
        const previous = list;
        list = playlist(plan.ranges, plan.fps);
        urls = plan.sources;
        fps = plan.fps;
        refresh(previous);
      });
    },
    get time() {
      return time;
    },
    get duration() {
      return list.duration;
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
      return mounted && loaded;
    },
    get loading() {
      return loading;
    },
    get waveform() {
      return undefined;
    },
    get locked() {
      return locked;
    },
    /** The stage calls this from an `$effect` too, so it's untracked for the same reason as `follow`. */
    lock(value: boolean) {
      untrack(() => {
        locked = value;
        if (value) {
          for (const slot of slots) slot.el.pause();
          paused = true;
          loaded = false;
        } else refresh();
      });
    },
    seek(seconds: number) {
      time = Math.min(Math.max(seconds, 0), list.duration);
      if (!mounted || !loaded) return;
      const spot = locate(list, seconds);
      if (spot) enter(spot);
    },
    toggle() {
      if (!mounted || locked || !loaded) return;
      // At the cut's end, play starts it over, the way the file player does. Playing on from the last
      // range's end would trip `check` at once and pause again.
      if (paused && time >= list.duration - 0.5 / fps) {
        const spot = locate(list, 0);
        if (spot) enter(spot);
      }
      if (paused)
        void on()
          .el.play()
          .catch(() => undefined);
      else on().el.pause();
    },
    pause() {
      if (loaded) on().el.pause();
    },
  } satisfies Playback & { follow: unknown };
}

export type LivePlayer = ReturnType<typeof createLivePlayer>;
