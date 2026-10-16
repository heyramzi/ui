/**
 * Tests for the unified analytics entrypoint.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import {
  initAnalytics,
  setProfileId,
  track,
  trackError,
  trackRevenue,
} from "#src/analytics/unified.js";

let umamiTrack: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  umamiTrack = vi.fn();
  vi.stubGlobal("window", {
    umami: { track: umamiTrack, identify: vi.fn() },
    location: { hostname: "example.com" },
  });
  vi.stubGlobal("document", {
    head: { appendChild: vi.fn() },
    createElement: () => ({ defer: false, src: "", dataset: {} }),
    querySelector: () => null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("initAnalytics", () => {
  it("starts tracking once initialized", () => {
    initAnalytics({
      providers: {
        umami: { websiteId: "w1", host: "https://umami.example.com", autoInjectScript: false },
      },
    });
    track("ready");
    expect(umamiTrack).toHaveBeenCalledWith("ready");
  });

  it("injects umami script tag with data-* attributes from options", () => {
    const appendChild = vi.fn();
    const dataset: Record<string, string> = {};
    const fakeScript = { defer: false, src: "", dataset } as unknown as HTMLScriptElement;
    vi.stubGlobal("document", {
      head: { appendChild },
      createElement: () => fakeScript,
      querySelector: () => null,
    });

    initAnalytics({
      providers: {
        umami: {
          websiteId: "w-perf",
          host: "https://umami.example.com",
          performance: true,
          tag: "v2",
          beforeSend: "umamiBeforeSend",
          domains: ["app.com", "www.app.com"],
          doNotTrack: true,
          autoTrack: false,
          excludeSearch: true,
          excludeHash: true,
        },
      },
    });

    expect(appendChild).toHaveBeenCalled();
    expect(fakeScript.src).toBe("https://umami.example.com/script.js");
    expect(dataset).toMatchObject({
      websiteId: "w-perf",
      performance: "true",
      tag: "v2",
      beforeSend: "umamiBeforeSend",
      domains: "app.com,www.app.com",
      doNotTrack: "true",
      autoTrack: "false",
      excludeSearch: "true",
      excludeHash: "true",
    });
  });

  it("skips tracking entirely when disabled is true", () => {
    initAnalytics({
      providers: { umami: { websiteId: "w1", host: "https://u" } },
      disabled: true,
    });
    track("anything");
    expect(umamiTrack).not.toHaveBeenCalled();
  });

  it("tracks nothing when no provider is configured", () => {
    initAnalytics({ providers: {} });
    track("anything");
    expect(umamiTrack).not.toHaveBeenCalled();
  });
});

describe("events", () => {
  it("track() sends the event", async () => {
    initAnalytics({
      providers: {
        umami: { websiteId: "w1", host: "https://u", autoInjectScript: false },
      },
    });
    track("hello", { foo: "bar" });
    expect(umamiTrack).toHaveBeenCalledWith("hello", { foo: "bar" });
  });

  it("trackError() sends an error event", async () => {
    initAnalytics({
      providers: {
        umami: { websiteId: "w1", host: "https://u", autoInjectScript: false },
      },
    });
    const err = new Error("boom");
    trackError({ error: err, surface: "checkout" });
    expect(umamiTrack).toHaveBeenCalledWith(
      "error",
      expect.objectContaining({ name: "Error", message: "boom", surface: "checkout" }),
    );
  });

  it("trackRevenue() forwards value and currency", async () => {
    initAnalytics({
      providers: {
        umami: { websiteId: "w1", host: "https://u", autoInjectScript: false },
      },
    });
    trackRevenue({
      event: "subscription_started",
      value: 49,
      currency: "USD",
      plan: "pro",
      transactionId: "sub_abc",
    });
    expect(umamiTrack).toHaveBeenCalledWith(
      "subscription_started",
      expect.objectContaining({
        revenue: 49,
        currency: "USD",
        plan: "pro",
        transaction_id: "sub_abc",
      }),
    );
  });

  it("setProfileId() calls identify", async () => {
    const identify = vi.fn();
    vi.stubGlobal("window", {
      umami: { track: umamiTrack, identify },
      location: { hostname: "example.com" },
    });
    initAnalytics({
      providers: {
        umami: { websiteId: "w1", host: "https://u", autoInjectScript: false },
      },
    });
    setProfileId("user_123");
    expect(identify).toHaveBeenCalledWith({ profileId: "user_123" });
  });

  it("cleanup function stops tracking", () => {
    const stop = initAnalytics({
      providers: {
        umami: { websiteId: "w1", host: "https://u", autoInjectScript: false },
      },
    });
    stop();
    track("late");
    expect(umamiTrack).not.toHaveBeenCalled();
  });
});
