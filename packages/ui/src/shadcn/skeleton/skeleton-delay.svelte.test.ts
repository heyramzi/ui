import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import SkeletonDelay from "#src/shadcn/skeleton/skeleton-delay.svelte";

const skeleton = createRawSnippet(() => ({ render: () => "<i>skeleton</i>" }));
const children = createRawSnippet(() => ({ render: () => "<b>content</b>" }));

function render(loading: boolean) {
  const props = $state({ loading, skeleton, children });
  const target = document.createElement("div");
  const app = mount(SkeletonDelay, { target, props });
  flushSync();
  return {
    shows: () => target.textContent,
    set: (next: boolean) => {
      props.loading = next;
      flushSync();
    },
    wait: (ms: number) => {
      vi.advanceTimersByTime(ms);
      flushSync();
    },
    done: () => void unmount(app),
  };
}

describe("SkeletonDelay", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows nothing for a fast answer, then the content", () => {
    const view = render(true);
    expect(view.shows()).toBe("");
    view.wait(100);
    view.set(false);
    expect(view.shows()).toBe("content");
    view.done();
  });

  it("shows the skeleton after 150ms and holds it 300ms", () => {
    const view = render(true);
    view.wait(150);
    expect(view.shows()).toBe("skeleton");
    view.wait(50);
    view.set(false);
    expect(view.shows()).toBe("skeleton");
    view.wait(250);
    expect(view.shows()).toBe("content");
    view.done();
  });

  it("draws the content at once when nothing is loading", () => {
    const view = render(false);
    expect(view.shows()).toBe("content");
    view.done();
  });
});
