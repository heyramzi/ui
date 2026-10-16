import { flushSync } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFilePlayer } from "#src/hooks/player.svelte.js";

/** jsdom has no media pipeline: a video here is a log of what was asked of it. */
let loads = 0;

beforeEach(() => {
  loads = 0;
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  const proto = HTMLMediaElement.prototype;
  proto.play = () => Promise.resolve();
  proto.pause = () => {};
  // A teardown calls `load()`, so a mount that keeps tearing down shows up here.
  proto.load = () => {
    loads += 1;
  };
});
afterEach(() => vi.unstubAllGlobals());

describe("the file player under the stage's mount effect", () => {
  it("keeps the same video when a re-render swaps the preview in", () => {
    const player = createFilePlayer();
    const host = document.createElement("div");
    const off = $effect.root(() => {
      $effect(() => player.mount(host));
    });
    flushSync();
    player.follow("/cut.review.mp4?v=1", undefined, "current");
    flushSync();
    const first = host.querySelector("video");
    // The re-render lands: a new file, the same element, nothing torn down.
    player.follow("/cut.review.mp4?v=2", undefined, "current");
    flushSync();
    expect(host.querySelectorAll("video")).toHaveLength(1);
    expect(host.querySelector("video")).toBe(first);
    expect(first?.getAttribute("src")).toBe("/cut.review.mp4?v=2");
    expect(loads).toBe(0);
    off();
  });
});
