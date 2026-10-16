import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { onInView } from "#src/effects/reveal/observe.js";

type Callback = (entries: { isIntersecting: boolean }[]) => void;

let callbacks: Callback[] = [];

class FakeObserver {
  constructor(callback: Callback) {
    callbacks.push(callback);
  }
  observe() {}
  disconnect() {}
}

function fire(isIntersecting: boolean) {
  for (const callback of callbacks) callback([{ isIntersecting }]);
}

describe("onInView", () => {
  beforeEach(() => {
    callbacks = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls onEnter once when the node first shows", () => {
    const onEnter = vi.fn();
    onInView(document.createElement("div"), { onEnter });
    fire(true);
    fire(true);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("calls onLeave only after an enter, and only when once is off", () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    onInView(document.createElement("div"), { once: false, onEnter, onLeave });
    fire(false);
    expect(onLeave).not.toHaveBeenCalled();
    fire(true);
    fire(false);
    fire(true);
    expect(onEnter).toHaveBeenCalledTimes(2);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("reads the callbacks from the latest update", () => {
    const first = vi.fn();
    const second = vi.fn();
    const action = onInView(document.createElement("div"), { onEnter: first });
    action?.update?.({ onEnter: second });
    fire(true);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
