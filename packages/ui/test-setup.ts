/*
 * jsdom ships no layout engine, so the browser APIs the showcase components call on mount are stubbed here as no-ops.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.scrollIntoView ??= () => {};
// WHY: jsdom has no SVG geometry, and the check-mark stroke animation reads the path length.
SVGElement.prototype.getTotalLength ??= () => 0;
