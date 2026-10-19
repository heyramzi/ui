import { describe, it, expect, vi, beforeEach, afterEach } from "vite-plus/test";

// The server module holds its config at module level, so each test re-imports it.

async function freshImport() {
  vi.resetModules();
  return import("#src/analytics/server.js");
}

const fetchMock = vi.fn();

function answer(body: string, status = 200) {
  fetchMock.mockResolvedValue(new Response(body, { status }));
}

function sent() {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return {
    url,
    headers: init.headers as Record<string, string>,
    body: JSON.parse(init.body as string) as { type: string; payload: Record<string, unknown> },
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  answer('{"cache":"x"}');
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const config = {
  hostUrl: "https://umami.example.com",
  websiteId: "abc-123",
  hostname: "example.com",
};

describe("trackServer", () => {
  it("awaits the POST to /api/send and resolves true", async () => {
    const { initServer, trackServer } = await freshImport();
    initServer(config);

    await expect(trackServer("signup")).resolves.toBe(true);

    const { url, headers, body } = sent();
    expect(url).toBe("https://umami.example.com/api/send");
    expect(headers["User-Agent"]).toMatch(/^Mozilla\/5\.0/);
    expect(body).toEqual({
      type: "event",
      payload: { website: "abc-123", hostname: "example.com", url: "/", name: "signup" },
    });
  });

  it("sends data, url and id", async () => {
    const { initServer, trackServer } = await freshImport();
    initServer(config);

    await trackServer("click", { label: "CTA" }, { url: "/home", id: "cs_123" });

    expect(sent().body.payload).toEqual({
      website: "abc-123",
      hostname: "example.com",
      url: "/home",
      name: "click",
      data: { label: "CTA" },
      id: "cs_123",
    });
  });

  it("still takes the url as a plain string", async () => {
    const { initServer, trackServer } = await freshImport();
    initServer(config);

    await trackServer("page_view", undefined, "/pricing");

    expect(sent().body.payload.url).toBe("/pricing");
    expect(sent().body.payload).not.toHaveProperty("id");
  });

  it("strips a trailing slash from hostUrl and forwards a custom userAgent", async () => {
    const { initServer, trackServer } = await freshImport();
    initServer({
      ...config,
      hostUrl: "https://umami.example.com/",
      userAgent: "Mozilla/5.0 Seam/1.0",
    });

    await trackServer("ua_test");

    expect(sent().url).toBe("https://umami.example.com/api/send");
    expect(sent().headers["User-Agent"]).toBe("Mozilla/5.0 Seam/1.0");
  });

  // Umami rejects an event with HTTP 200 and the body `beep`.
  it("resolves false when Umami answers beep", async () => {
    answer("beep");
    const { initServer, trackServer } = await freshImport();
    initServer(config);

    await expect(trackServer("dropped")).resolves.toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("resolves false on an HTTP error", async () => {
    answer("nope", 500);
    const { initServer, trackServer } = await freshImport();
    initServer(config);

    await expect(trackServer("server_error")).resolves.toBe(false);
  });

  it("resolves false and never throws when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("network failure"));
    const { initServer, trackServer } = await freshImport();
    initServer(config);

    await expect(trackServer("risky_event")).resolves.toBe(false);
  });

  it("resolves false without initServer and sends nothing", async () => {
    const { trackServer } = await freshImport();

    await expect(trackServer("orphan_event")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("trackServerRevenue", () => {
  it("merges revenue and currency into data and forwards url and id", async () => {
    const { initServer, trackServerRevenue } = await freshImport();
    initServer(config);

    await expect(
      trackServerRevenue(
        "Purchase Complete",
        9.99,
        "EUR",
        { plan: "pro" },
        { url: "/buy", id: "cs_1" },
      ),
    ).resolves.toBe(true);

    expect(sent().body.payload).toMatchObject({
      name: "Purchase Complete",
      url: "/buy",
      id: "cs_1",
      data: { plan: "pro", revenue: 9.99, currency: "EUR" },
    });
  });

  it("resolves false when the send fails", async () => {
    answer("beep");
    const { initServer, trackServerRevenue } = await freshImport();
    initServer(config);

    await expect(
      trackServerRevenue("checkout", 19.99, "USD", undefined, "/checkout"),
    ).resolves.toBe(false);
  });
});
