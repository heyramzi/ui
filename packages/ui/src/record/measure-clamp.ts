import { untrack } from "svelte";
import type { Attachment } from "svelte/attachments";

/** Reports whether a line-clamped box cuts its text, so "More" shows only then. */

// WHY measure: a note that fits two lines at 1280px overflows at 390px.

// WHY untracked: an open box keeps its last answer, so a fold never remounts the toggle under focus.
export function measureClamp(
  expanded: () => boolean,
  onCut: (cut: boolean) => void,
): Attachment<HTMLElement> {
  return (el) => {
    const measure = () =>
      untrack(() => {
        if (!expanded()) onCut(el.scrollHeight > el.clientHeight + 1);
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // A web font landing rewraps the text in a box that keeps its height, and the observer stays quiet.
    let live = true;
    void document.fonts?.ready.then(() => live && measure());
    document.fonts?.addEventListener("loadingdone", measure);
    return () => {
      live = false;
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", measure);
    };
  };
}
