import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import type { LibraryCard } from "#src/core/types.js";
import LayoutLibrary from "#src/ui/LayoutLibrary.svelte";

const card = (name: string, over: Partial<LibraryCard> = {}): LibraryCard => ({
  name,
  group: "CTAs",
  preview: { w: 1920, h: 1080, boxes: [{ role: "media", x: 0, y: 0, w: 1920, h: 1080 }] },
  ...over,
});

let app: ReturnType<typeof mount> | undefined;
const draw = (layouts: LibraryCard[]) => {
  document.body.innerHTML = "";
  app = mount(LayoutLibrary, { target: document.body, props: { layouts } });
  flushSync();
};
afterEach(() => {
  if (app) void unmount(app);
  app = undefined;
});

describe("LayoutLibrary thumbnails", () => {
  it("plays a card's clip in place of the diagram", () => {
    draw([card("CTA", { clip: "/ctas/media/join.webm" })]);
    const video = document.querySelector<HTMLVideoElement>("figure video.clip");
    expect(video?.getAttribute("src")).toBe("/ctas/media/join.webm");
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.autoplay).toBe(false);
    expect(video?.getAttribute("preload")).toBe("metadata");
    expect(video?.hasAttribute("playsinline")).toBe(true);
    expect(document.querySelector("figure svg")).toBeNull();
  });

  it("draws the diagram when a card has no clip", () => {
    draw([card("Split")]);
    expect(document.querySelector("figure video")).toBeNull();
    expect(document.querySelector("figure svg")).not.toBeNull();
  });

  it("falls back to the diagram when the clip fails to load", () => {
    draw([card("CTA", { clip: "/missing.webm" }), card("End Card", { clip: "/end.webm" })]);
    const first = document.querySelector<HTMLVideoElement>("figure video.clip");
    first?.dispatchEvent(new Event("error"));
    flushSync();
    const figures = [...document.querySelectorAll("figure")];
    expect(figures[0]?.querySelector("video")).toBeNull();
    expect(figures[0]?.querySelector("svg")).not.toBeNull();
    // The other card keeps its clip.
    expect(figures[1]?.querySelector("video")).not.toBeNull();
  });
});
