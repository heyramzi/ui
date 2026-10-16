import { tick } from "svelte";

/** Room left after the last second, so the final tick label isn't clipped. */
export const END_GAP = 14;
/** The closest the timeline zooms: pixels per second. */
const MAX_PX_PER_SECOND = 400;
const STEP = 1.6;

type Wiring = { view: HTMLElement; strip: HTMLElement; duration: () => number; time: () => number };

/**
 * The timeline's zoom and scroll. The timeline draws from `railW` and `scroll`, so a canvas can
 * stay one screen wide however far in the cut is zoomed.
 */
export function createZoom() {
  let level = $state(1);
  let scroll = $state(0);
  let width = $state(0);
  let wired: Wiring | null = null;

  const railW = $derived(Math.max(0, level * width - END_GAP));

  const secondsAt = (x: number, duration: number) => ((x + scroll) / railW) * duration;

  function most(): number {
    if (!wired) return 1;
    return Math.max(1, (wired.duration() * MAX_PX_PER_SECOND) / Math.max(1, width));
  }

  /** Zoom to `next`, keeping the time under `clientX` (else the playhead) where it is. */
  async function to(next: number, clientX?: number): Promise<void> {
    if (!wired) return;
    const { view, strip, duration, time } = wired;
    const total = duration();
    if (!total || railW === 0) return;
    const box = view.getBoundingClientRect();
    const anchor = Math.min(
      Math.max(clientX === undefined ? (time() / total) * railW - scroll : clientX - box.left, 0),
      width,
    );
    const at = secondsAt(anchor, total);
    level = Math.min(Math.max(next, 1), most());
    await tick();
    view.scrollLeft = (at / total) * strip.clientWidth - anchor;
    scroll = view.scrollLeft;
  }

  /** Scroll so `seconds` is on screen, leaving a lead on the side it entered from. */
  function reveal(seconds: number, lead = 0.15): void {
    if (!wired || level === 1) return;
    const total = wired.duration();
    if (!total) return;
    const x = (seconds / total) * railW - scroll;
    if (x < 0 || x > width - 24) wired.view.scrollLeft = (seconds / total) * railW - width * lead;
  }

  function attach(next: Wiring): () => void {
    wired = next;
    const { view } = next;
    const measure = () => {
      width = view.clientWidth;
      scroll = view.scrollLeft;
    };
    // WHY: a pinch or ctrl-wheel zooms at the pointer, and a plain wheel pans once zoomed. Both need preventDefault, so the listener can't be passive.
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        void to(level * Math.exp(-event.deltaY * 0.01), event.clientX);
      } else if (level > 1 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        view.scrollLeft += event.deltaY;
      }
    };
    const watch = new ResizeObserver(measure);
    watch.observe(view);
    view.addEventListener("scroll", measure, { passive: true });
    view.addEventListener("wheel", wheel, { passive: false });
    measure();
    return () => {
      watch.disconnect();
      view.removeEventListener("scroll", measure);
      view.removeEventListener("wheel", wheel);
      wired = null;
    };
  }

  return {
    attach,
    to,
    reveal,
    secondsAt,
    in: () => to(level * STEP),
    out: () => to(level / STEP),
    fit: () => to(1),
    /** Nudge the view when a drag runs past its edge. */
    edge(clientX: number) {
      if (!wired || level === 1) return;
      const box = wired.view.getBoundingClientRect();
      if (clientX < box.left + 24) wired.view.scrollLeft -= 12;
      else if (clientX > box.right - 24) wired.view.scrollLeft += 12;
    },
    get level() {
      return level;
    },
    get scroll() {
      return scroll;
    },
    get width() {
      return width;
    },
    get railW() {
      return railW;
    },
    get canZoomIn() {
      return level < most() - 0.01;
    },
  };
}

export type Zoom = ReturnType<typeof createZoom>;
