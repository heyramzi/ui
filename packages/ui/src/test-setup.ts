// WHY a setup file and not a beforeAll: layerchart and svelte/motion call

// matchMedia while their module evaluates, which happens on import, before any hook runs. jsdom ships none of these, and bits-ui and embla measure with them.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.ResizeObserver ??= ObserverStub as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= ObserverStub as unknown as typeof IntersectionObserver;

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

// jsdom lays out nothing, so an SVG path has no length to give. The success
// check reads one to set its dash offset.
if (globalThis.SVGElement && !("getTotalLength" in globalThis.SVGElement.prototype)) {
  Object.defineProperty(globalThis.SVGElement.prototype, "getTotalLength", {
    value: () => 100,
    configurable: true,
  });
}
