/*
 * jsdom ships no layout engine, so the browser APIs the gallery demos call on mount are stubbed here as no-ops.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.scrollIntoView ??= () => {};
// WHY: jsdom has no Web Animations, and animate:flip calls both when a keyed row moves.
Element.prototype.getAnimations ??= () => [];
Element.prototype.animate ??= function () {
  const animation = {
    onfinish: null as (() => void) | null,
    playState: "finished",
    effect: null,
    cancel() {},
    finish() {},
  };
  queueMicrotask(() => animation.onfinish?.());
  return animation as unknown as Animation;
};
// WHY: jsdom has no SVG geometry, and the check-mark stroke animation reads the path length.
SVGElement.prototype.getTotalLength ??= () => 0;

// WHY here and not in a test: svelte/motion and layerchart call matchMedia while their module
// evaluates, on import, before any hook runs. bits-ui and embla measure with the observer.
globalThis.IntersectionObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as unknown as typeof IntersectionObserver;

globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as typeof globalThis.matchMedia;
