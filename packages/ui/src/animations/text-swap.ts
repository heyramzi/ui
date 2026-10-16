export interface SwapTextOptions {
  durationMs?: number;
}

function parseDuration(value: string | null | undefined): number {
  if (!value) return 200;
  const trimmed = value.trim();
  if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed);
  if (trimmed.endsWith("s")) return Number.parseFloat(trimmed) * 1000;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 200;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function swapText(el: HTMLElement, newText: string, opts?: SwapTextOptions): void {
  if (prefersReducedMotion()) {
    el.textContent = newText;
    el.classList.remove("is-exit", "is-enter-start");
    return;
  }

  const durationMs =
    opts?.durationMs ?? parseDuration(getComputedStyle(el).getPropertyValue("--text-swap-dur"));
  el.classList.add("t-text-swap", "is-exit");

  window.setTimeout(() => {
    el.textContent = newText;
    el.classList.remove("is-exit");
    el.classList.add("is-enter-start");

    requestAnimationFrame(() => {
      void el.offsetHeight; // read to force a reflow between the two class changes
      el.classList.remove("is-enter-start");
    });
  }, durationMs);
}
