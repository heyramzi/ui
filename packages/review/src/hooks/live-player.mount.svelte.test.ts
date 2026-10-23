import { flushSync } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createLivePlayer } from "#src/hooks/live-player.svelte.js";
import type { LivePlan } from "#src/core/types.js";

/** jsdom has no media pipeline: a video here is a log of what was asked of it. */
let loads = 0;

beforeEach(() => {
  loads = 0;
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  const proto = HTMLMediaElement.prototype;
  Object.defineProperty(proto, "readyState", { configurable: true, get: () => 0 });
  proto.play = () => Promise.resolve();
  proto.pause = () => {};
  // A teardown calls `load()` on both videos, so a mount that keeps tearing down shows up here.
  proto.load = () => {
    loads += 1;
  };
});
afterEach(() => vi.unstubAllGlobals());

const plan: LivePlan = {
  fps: 30,
  ranges: [
    { source: "a", start: 0, end: 4, kept: true },
    { source: "a", start: 5, end: 9, kept: true },
  ],
  sources: { a: "/a.mp4" },
};

describe("the play-list player under the stage's mount effect", () => {
  it("mounts once and stays mounted when the plan arrives and the lock lifts", () => {
    const player = createLivePlayer();
    const host = document.createElement("div");
    const off = $effect.root(() => {
      // The stage's own effect: it mounts the player the moment its host exists.
      $effect(() => player.mount(host));
    });
    flushSync();
    player.follow(plan);
    player.lock(false);
    flushSync();
    // Mounted once: two videos, none torn down, the proxy asked for once per slot.
    expect(host.querySelectorAll("video")).toHaveLength(2);
    expect(loads).toBe(0);
    expect([...host.querySelectorAll("video")].map((el) => el.getAttribute("src"))).toEqual([
      "/a.mp4",
      "/a.mp4",
    ]);
    // A later lock and unlock (the job flips outdated and back) doesn't remount either.
    player.lock(true);
    player.lock(false);
    flushSync();
    expect(loads).toBe(0);
    off();
  });
});
