import { describe, it, expect, vi, beforeEach } from "vite-plus/test";

// The server module holds module-level singletons (client, _config).
// Each test resets them by calling vi.resetModules() + re-importing.

async function freshImport() {
  vi.resetModules();
  return import("#src/analytics/server.js");
}

beforeEach(() => {
  vi.resetModules();
});

// ---- initServer ----

describe("initServer", () => {
  it("stores config so that subsequent trackServer calls succeed", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("test_event");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({ name: "test_event" });
  });

  it("throws when trackServer is called without prior initServer", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.doMock("@umami/node", () => ({ Umami: class {} }));

    const { trackServer } = await freshImport();
    trackServer("orphan_event");
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics] Server track failed:",
      expect.objectContaining({ message: "Call initServer() before tracking events" }),
    );
  });
});

// ---- trackServer ----

describe("trackServer", () => {
  it("builds a payload with only name when no data or url is given", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("signup");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({ name: "signup" });
  });

  it("includes data in the payload when provided", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("feature_used", { feature: "export", count: 5 });
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({
      name: "feature_used",
      data: { feature: "export", count: 5 },
    });
  });

  it("includes url in the payload when provided", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("page_view", undefined, "/pricing");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({ name: "page_view", url: "/pricing" });
  });

  it("includes both data and url when both are provided", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("click", { label: "CTA" }, "/home");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({
      name: "click",
      data: { label: "CTA" },
      url: "/home",
    });
  });

  it("logs an error and does not throw when track rejects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockTrack = vi.fn().mockRejectedValue(new Error("network failure"));
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("risky_event");
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleSpy).toHaveBeenCalledWith("[analytics] Server track failed:", expect.any(Error));
  });

  it("reuses the same Umami instance across multiple calls", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    let constructorCallCount = 0;
    vi.doMock("@umami/node", () => ({
      Umami: class {
        constructor() {
          constructorCallCount++;
        }
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServer("first");
    // Wait for the first getClient() promise to resolve and set the cached client
    await new Promise((r) => setTimeout(r, 10));
    trackServer("second");
    await new Promise((r) => setTimeout(r, 10));

    expect(constructorCallCount).toBe(1);
    expect(mockTrack).toHaveBeenCalledTimes(2);
  });
});

// ---- trackServerRevenue ----

describe("trackServerRevenue", () => {
  it("tracks a revenue event with revenue and currency merged into data", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServerRevenue } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServerRevenue("purchase", 49.99, "USD");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({
      name: "purchase",
      data: { revenue: 49.99, currency: "USD" },
    });
  });

  it("merges extra EventData alongside revenue and currency", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServerRevenue } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServerRevenue("subscription", 9.99, "EUR", { plan: "pro" });
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({
      name: "subscription",
      data: { plan: "pro", revenue: 9.99, currency: "EUR" },
    });
  });

  it("passes url to the underlying trackServer call", async () => {
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        track = mockTrack;
      },
    }));

    const { initServer, trackServerRevenue } = await freshImport();
    initServer({ hostUrl: "https://umami.example.com", websiteId: "abc-123" });
    trackServerRevenue("checkout", 19.99, "USD", undefined, "/checkout");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockTrack).toHaveBeenCalledWith({
      name: "checkout",
      data: { revenue: 19.99, currency: "USD" },
      url: "/checkout",
    });
  });
});

// ---- initServer config forwarding ----

describe("initServer config forwarding", () => {
  it("passes hostUrl and websiteId to the Umami constructor", async () => {
    let capturedConfig = null;
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        constructor(cfg: unknown) {
          capturedConfig = cfg;
        }
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({ hostUrl: "https://analytics.myapp.io", websiteId: "xyz-789" });
    trackServer("init_test");
    await new Promise((r) => setTimeout(r, 0));

    expect(capturedConfig).toEqual({
      hostUrl: "https://analytics.myapp.io",
      websiteId: "xyz-789",
      userAgent: "Server",
    });
  });

  it("forwards a custom userAgent to the Umami constructor", async () => {
    let capturedConfig = null;
    const mockTrack = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@umami/node", () => ({
      Umami: class {
        constructor(cfg: unknown) {
          capturedConfig = cfg;
        }
        track = mockTrack;
      },
    }));

    const { initServer, trackServer } = await freshImport();
    initServer({
      hostUrl: "https://umami.example.com",
      websiteId: "abc-123",
      userAgent: "MyBot/1.0",
    });
    trackServer("ua_test");
    await new Promise((r) => setTimeout(r, 0));

    expect(capturedConfig).toEqual({
      hostUrl: "https://umami.example.com",
      websiteId: "abc-123",
      userAgent: "MyBot/1.0",
    });
  });
});
