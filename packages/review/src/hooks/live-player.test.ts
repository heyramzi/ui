import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createLivePlayer } from "#src/hooks/live-player.svelte.js";
import type { LivePlan } from "#src/core/types.js";

/** jsdom has no media pipeline: a video here is a clock we move and a log of what was asked of it. */
const time = new WeakMap<HTMLMediaElement, number>();
const playing = new WeakSet<HTMLMediaElement>();
let frames: (() => void)[] = [];

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (run: () => void) => frames.push(run));
  vi.stubGlobal("cancelAnimationFrame", () => {});
  const proto = HTMLMediaElement.prototype;
  Object.defineProperty(proto, "currentTime", {
    configurable: true,
    get(this: HTMLMediaElement) {
      return time.get(this) ?? 0;
    },
    set(this: HTMLMediaElement, value: number) {
      time.set(this, value);
    },
  });
  Object.defineProperty(proto, "readyState", { configurable: true, get: () => 4 });
  Object.defineProperty(proto, "paused", {
    configurable: true,
    get(this: HTMLMediaElement) {
      return !playing.has(this);
    },
  });
  proto.play = function (this: HTMLMediaElement) {
    playing.add(this);
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  };
  proto.pause = function (this: HTMLMediaElement) {
    if (!playing.delete(this)) return;
    this.dispatchEvent(new Event("pause"));
  };
  proto.load = () => {};
});
afterEach(() => vi.unstubAllGlobals());

const plan = (over: Partial<LivePlan> = {}): LivePlan => ({
  fps: 30,
  ranges: [
    { source: "a", start: 0, end: 4, kept: true },
    { source: "a", start: 4, end: 6, kept: false },
    { source: "b", start: 10, end: 12, kept: true },
  ],
  sources: { a: "/a.mp4", b: "/b.mp4" },
  ...over,
});

function ready(over?: Partial<LivePlan>) {
  const player = createLivePlayer();
  const host = document.createElement("div");
  const off = player.mount(host);
  player.follow(plan(over));
  player.lock(false);
  const [one, two] = [...host.querySelectorAll("video")];
  if (!one || !two) throw new Error("two videos");
  /** One frame passes: the player checks the clock. */
  const frame = () => frames.splice(0).forEach((run) => run());
  return { player, one, two, frame, off };
}

describe("the play-list player", () => {
  it("puts the first range on one video and waits at the next range on the other", () => {
    const { player, one, two } = ready();
    expect(player.duration).toBe(6);
    expect(one.getAttribute("src")).toBe("/a.mp4");
    expect(time.get(one)).toBe(0);
    expect(two.getAttribute("src")).toBe("/b.mp4");
    expect(time.get(two)).toBe(10);
    expect(player.paused).toBe(true);
  });

  it("jumps to the next take at a range's end, and keeps the cut's clock running", () => {
    const { player, one, two, frame } = ready();
    player.toggle();
    expect(player.paused).toBe(false);
    time.set(one, 3.5);
    frame();
    expect(player.time).toBeCloseTo(3.5);
    // Half a frame before the end of the range, the swap happens.
    time.set(one, 4 - 0.5 / 30);
    frame();
    expect(playing.has(two)).toBe(true);
    expect(playing.has(one)).toBe(false);
    expect(two.style.visibility).toBe("visible");
    expect(one.style.visibility).toBe("hidden");
    time.set(two, 10.5);
    frame();
    expect(player.time).toBeCloseTo(4.5);
  });

  it("stops at the last range's end", () => {
    const { player, two, frame } = ready();
    player.seek(5);
    player.toggle();
    time.set(two, 12);
    frame();
    expect(player.paused).toBe(true);
    expect(player.time).toBe(6);
  });

  it("seeks into the middle of a range on another take", () => {
    const { player, one, two } = ready();
    player.seek(5);
    expect(time.get(two)).toBe(11);
    expect(two.style.visibility).toBe("visible");
    expect(player.time).toBe(5);
    expect(one.getAttribute("src")).toBe("/a.mp4");
  });

  it("takes a note that moves a range in place: no lock, the take's moment stays", () => {
    const { player, one, frame } = ready();
    player.toggle();
    time.set(one, 2);
    frame();
    player.follow(
      plan({
        ranges: [
          { source: "a", start: 0, end: 3, kept: true },
          { source: "b", start: 10, end: 12, kept: true },
        ],
      }),
    );
    expect(player.locked).toBe(false);
    expect(player.duration).toBe(5);
    expect(player.paused).toBe(false);
    expect(time.get(one)).toBe(2);
    time.set(one, 2.9);
    frame();
    expect(player.time).toBeCloseTo(2.9);
  });

  it("holds nothing while locked: no proxy is loaded until the job is done", () => {
    const player = createLivePlayer();
    const host = document.createElement("div");
    player.mount(host);
    player.follow(plan());
    const [one] = [...host.querySelectorAll("video")];
    expect(one?.getAttribute("src")).toBeNull();
    player.toggle();
    expect(player.paused).toBe(true);
  });
});
