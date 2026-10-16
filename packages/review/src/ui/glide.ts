const running = new WeakMap<HTMLElement, Animation>();

/** A token like `200ms` or `.2s` in milliseconds. WHY: the built stylesheet is minified, so 200ms can come back as .2s. */
function ms(raw: string): number {
  const value = raw.trim();
  return value.endsWith("ms") ? parseFloat(value) || 0 : (parseFloat(value) || 0) * 1000;
}

/**
 * Moves a tab indicator to its new box on transform alone.
 *
 * `write` sets the new box at once. The indicator then starts from where it was on screen, as a
 * translate and scale, and eases to none, so the browser never lays out a width or height mid-move.
 * Timing reads `--tabs-dur` and `--tabs-ease`, which reduced motion sets to 0ms, so it jumps there.
 */
export function glide(el: HTMLElement | null | undefined, write: () => void): void {
  if (!el) return write();
  const before = el.getBoundingClientRect();
  running.get(el)?.cancel();
  write();
  const after = el.getBoundingClientRect();
  if (!before.width || !before.height || !after.width || !after.height) return;

  const style = getComputedStyle(el);
  const duration = ms(style.getPropertyValue("--tabs-dur"));
  if (!duration || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const dx = before.left - after.left;
  const dy = before.top - after.top;
  const sx = before.width / after.width;
  const sy = before.height / after.height;
  if (!dx && !dy && sx === 1 && sy === 1) return;

  const easing = style.getPropertyValue("--tabs-ease").trim() || "ease-out";
  const move = el.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: "none" }],
    { duration, easing },
  );
  running.set(el, move);
}
