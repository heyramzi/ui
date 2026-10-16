import { clockToSeconds } from "#src/core/format.js";
import type { NoteTarget } from "#src/core/types.js";

export type TextTarget = Extract<NoteTarget, { kind: "text" }>;

const lineOf = (node: Node | null): HTMLElement | null =>
  (node instanceof Element ? node : node?.parentElement)?.closest<HTMLElement>("[data-line]") ??
  null;

/** Selecting transcript words gives a `{ kind: "text" }` target and the spot to float a button at. */
export function useTextSelection(root: () => HTMLElement | null) {
  let target = $state.raw<TextTarget | null>(null);
  let anchor = $state.raw<{ x: number; y: number } | null>(null);
  let frame = 0;

  function clear() {
    target = null;
    anchor = null;
  }

  function read() {
    const selection = document.getSelection();
    const host = root();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !host) return clear();
    const a = lineOf(selection.anchorNode);
    const b = lineOf(selection.focusNode);
    if (!a || !b || !host.contains(a) || !host.contains(b)) return clear();
    const [first, last] =
      clockToSeconds(a.dataset.at ?? "") <= clockToSeconds(b.dataset.at ?? "") ? [a, b] : [b, a];
    const quote = selection.toString().replace(/\s+/g, " ").trim().slice(0, 240);
    const from = first.dataset.at;
    const to = last.dataset.at;
    if (!quote || !from || !to) return clear();
    const box = selection.getRangeAt(0).getBoundingClientRect();
    target = { kind: "text", from, to, quote };
    anchor = { x: box.left + box.width / 2, y: box.top };
  }

  $effect(() => {
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    document.addEventListener("selectionchange", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      document.removeEventListener("selectionchange", schedule);
      window.removeEventListener("scroll", schedule, true);
      cancelAnimationFrame(frame);
    };
  });

  return {
    get target() {
      return target;
    },
    get anchor() {
      return anchor;
    },
    clear() {
      document.getSelection()?.removeAllRanges();
      clear();
    },
  };
}

export type TextSelection = ReturnType<typeof useTextSelection>;
