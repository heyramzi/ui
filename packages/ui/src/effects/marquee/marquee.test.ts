import { afterEach, describe, expect, it } from "vite-plus/test";
import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import Marquee from "#src/effects/marquee/Marquee.svelte";

let app: ReturnType<typeof mount> | null = null;

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = "";
});

describe("Marquee copies", () => {
  it("keeps only the first copy's links in the Tab order and the accessibility tree", () => {
    const children = createRawSnippet(() => ({ render: () => '<a href="#one">One</a>' }));
    app = mount(Marquee, { target: document.body, props: { children, repeat: 3 } });
    flushSync();
    const tracks = [...document.querySelectorAll<HTMLElement>(".marquee__track")];
    expect(tracks).toHaveLength(3);
    // jsdom has no inert, so the property Svelte sets never reflects to the attribute here.
    expect(tracks.map((t) => Boolean(t.inert))).toEqual([false, true, true]);
    expect(tracks.map((t) => t.getAttribute("aria-hidden"))).toEqual([null, "true", "true"]);
  });
});
