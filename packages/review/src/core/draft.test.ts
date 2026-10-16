import { describe, expect, it } from "vitest";
import { finalButton, finalRoute, guessedRenderMs, previewToShow, progressOf, renderEstimate } from "#src/core/draft.js";

describe("previewToShow", () => {
  it("keeps the file on screen while the preview waits or renders", () => {
    for (const state of ["queued", "rendering"] as const)
      expect(previewToShow("a.mp4?t=1", "a.mp4?t=2", state)).toBe("a.mp4?t=1");
  });

  it("takes the new file once the render is over", () => {
    for (const state of ["current", "none", "outdated", "failed"] as const)
      expect(previewToShow("a.mp4?t=1", "a.mp4?t=2", state)).toBe("a.mp4?t=2");
  });

  it("takes it at once for a tool that doesn't render", () => {
    expect(previewToShow("a.mp4?t=1", "a.mp4?t=2", undefined)).toBe("a.mp4?t=2");
  });

  it("leaves the same file alone", () => {
    expect(previewToShow("a.mp4?t=1", "a.mp4?t=1", "current")).toBe("a.mp4?t=1");
  });
});

describe("renderEstimate", () => {
  it("starts at nothing and says how long is left, in steps of 5 seconds", () => {
    const first = renderEstimate(0, 40_000);
    expect(first.fraction).toBe(0);
    expect(first).toMatchObject({ pace: "left", seconds: 40 });
    expect(renderEstimate(12_000, 40_000)).toMatchObject({ pace: "left", seconds: 30 });
    expect(renderEstimate(0, 100_000).seconds).toBe(105);
  });

  it("closes on 95% and never reaches it, however long the render runs", () => {
    expect(renderEstimate(40_000, 40_000).fraction).toBeCloseTo(0.9, 1);
    for (const ms of [60_000, 600_000, 36_000_000]) {
      const { fraction } = renderEstimate(ms, 40_000);
      expect(fraction).toBeLessThan(0.95 + 1e-9);
      expect(fraction).toBeLessThan(1);
    }
  });

  it("never goes backwards as time passes", () => {
    let last = -1;
    for (let ms = 0; ms <= 120_000; ms += 1_000) {
      const { fraction } = renderEstimate(ms, 40_000);
      expect(fraction).toBeGreaterThanOrEqual(last);
      last = fraction;
    }
  });

  it("owns up when the render runs past the guess", () => {
    expect(renderEstimate(38_000, 40_000).pace).toBe("soon");
    expect(renderEstimate(80_000, 40_000).pace).toBe("late");
  });

  it("guesses a render for a project that has none, from the cut's length", () => {
    expect(guessedRenderMs(10)).toBe(15_000);
    expect(guessedRenderMs(120)).toBe(60_000);
  });
});

describe("finalButton", () => {
  it("offers the final when there isn't a current one, and says why when it can", () => {
    expect(finalButton({ state: "none" })).toEqual({ label: "Render final", disabled: false });
    expect(finalButton({ state: "outdated" })).toMatchObject({ label: "Render final", disabled: false });
    expect(finalButton({ state: "failed", stage: "render", error: "disk full" })).toMatchObject({
      disabled: false,
      tip: "The last try didn't finish. Try again.",
    });
  });

  it("can't be pressed while the final waits, draws, or is up to date", () => {
    expect(finalButton({ state: "queued", ahead: 0, outdated: false })).toEqual({ label: "Your final is next in line", disabled: true });
    expect(finalButton({ state: "queued", ahead: 2, outdated: true }).label).toBe("Your final is in line");
    expect(finalButton({ state: "rendering", elapsedMs: 5, outdated: false })).toEqual({ label: "Making your final", disabled: true });
    expect(
      finalButton({ state: "rendering", elapsedMs: 5, outdated: false, progress: { stage: "preparing" } }).label,
    ).toBe("Making your final, getting ready");
    expect(finalButton({ state: "current" })).toEqual({ label: "Final is up to date", disabled: true });
  });

  it("asks the studio's render route for the video, name encoded", () => {
    expect(finalRoute("a 24")).toBe("/p/a%2024/render");
  });
});

describe("progressOf", () => {
  it("names the encode and carries on from the matte's 55%, so the bar moves while melt runs", () => {
    expect(progressOf({ stage: "matting", done: 100, total: 100 }).words).toBe("55%");
    const half = progressOf({ stage: "encoding", done: 50, total: 100 });
    expect(half.words).toBe("encoding 75%");
    expect(half.fraction).toBeCloseTo(0.75);
  });
});
