import { describe, expect, it, vi } from "vite-plus/test";
import { UmamiReportingClient, type UmamiFetch } from "#src/analytics/umami/reporting.js";

type Route = { status?: number; body: unknown };

/**
 * A fetch stand-in that answers by path suffix and records every call, so a
 * test can assert on headers and on how many times the network was touched.
 */
function makeFetch(routes: Record<string, Route>) {
  const calls: {
    url: string;
    method?: string;
    headers: Record<string, string>;
    body?: string;
  }[] = [];

  const impl: UmamiFetch = async (url, init) => {
    calls.push({ url, method: init?.method, headers: init?.headers ?? {}, body: init?.body });
    const key = Object.keys(routes).find((path) => url.includes(path));
    const route = key ? routes[key] : undefined;
    if (!route) {
      return { ok: false, status: 404, statusText: "Not Found", json: async () => ({}) };
    }
    const status = route.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: async () => route.body,
    };
  };

  return { impl: vi.fn(impl) as unknown as UmamiFetch, calls };
}

const CREDENTIALS = {
  apiUrl: "https://umami.example.com/",
  username: "ops@example.com",
  password: "secret",
};

const LOGIN: Route = { body: { token: "tok", user: { id: "u1", username: "ops" } } };

describe("UmamiReportingClient auth", () => {
  it("mints a token once and reuses it across requests", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/active": { body: { visitors: 3 } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getActive("site-1");
    await client.getActive("site-1");

    const logins = calls.filter((c) => c.url.includes("/api/auth/login"));
    expect(logins).toHaveLength(1);
  });

  it("strips a trailing slash from the api url", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/active": { body: { visitors: 0 } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getActive("site-1");

    expect(calls[0].url).toBe("https://umami.example.com/api/auth/login");
  });

  it("sends both username and email so either login mode matches", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/active": { body: { visitors: 0 } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getActive("site-1");

    expect(JSON.parse(calls[0].body ?? "{}")).toEqual({
      username: "ops@example.com",
      email: "ops@example.com",
      password: "secret",
    });
  });

  it("attaches Cloudflare Access headers to every call when a service token is given", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/active": { body: { visitors: 1 } },
    });
    const client = new UmamiReportingClient({
      ...CREDENTIALS,
      accessClientId: "cf-id",
      accessClientSecret: "cf-secret",
      fetchImpl: impl,
    });

    await client.getActive("site-1");

    for (const call of calls) {
      expect(call.headers["CF-Access-Client-Id"]).toBe("cf-id");
      expect(call.headers["CF-Access-Client-Secret"]).toBe("cf-secret");
    }
  });

  it("omits the Access headers entirely when no service token is given", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/active": { body: { visitors: 1 } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getActive("site-1");

    expect(calls[0].headers["CF-Access-Client-Id"]).toBeUndefined();
  });

  it("throws with the status when the login is rejected", async () => {
    const { impl } = makeFetch({ "/api/auth/login": { status: 401, body: {} } });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await expect(client.getActive("site-1")).rejects.toThrow(/Umami auth failed: 401/);
  });

  it("drops the cached token when a request comes back 401", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/active": { status: 401, body: {} },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await expect(client.getActive("site-1")).rejects.toThrow(/token expired/);
    await expect(client.getActive("site-1")).rejects.toThrow(/token expired/);

    // Two logins, because the first 401 invalidated the token it had cached.
    expect(calls.filter((c) => c.url.includes("/api/auth/login"))).toHaveLength(2);
  });
});

describe("UmamiReportingClient websites", () => {
  it("merges personal and team websites, deduped by id", async () => {
    const { impl } = makeFetch({
      "/api/auth/login": LOGIN,
      "/api/teams/team-1/websites": {
        body: { data: [{ id: "b", name: "B", domain: "b.com" }], count: 1, page: 1, pageSize: 150 },
      },
      "/api/websites?": {
        body: {
          data: [
            { id: "a", name: "A", domain: "a.com" },
            { id: "b", name: "B", domain: "b.com" },
          ],
          count: 2,
          page: 1,
          pageSize: 150,
        },
      },
    });
    const client = new UmamiReportingClient({
      ...CREDENTIALS,
      teamId: "team-1",
      fetchImpl: impl,
    });

    const websites = await client.getWebsites();

    expect(websites.map((w) => w.id)).toEqual(["a", "b"]);
  });

  it("caches the website list rather than re-listing on every lookup", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/api/websites?": {
        body: { data: [{ id: "a", name: "A", domain: "a.com" }], count: 1, page: 1, pageSize: 150 },
      },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getWebsites();
    await client.getWebsites();

    expect(calls.filter((c) => c.url.includes("/api/websites?"))).toHaveLength(1);
  });

  it("resolves a site by uuid without listing anything", async () => {
    const { impl, calls } = makeFetch({ "/api/auth/login": LOGIN });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    const id = await client.resolveSiteId("cff58573-0126-4ecc-a054-aaeabce758bd");

    expect(id).toBe("cff58573-0126-4ecc-a054-aaeabce758bd");
    expect(calls).toHaveLength(0);
  });

  it("resolves a site by exact domain, then by partial name", async () => {
    const { impl } = makeFetch({
      "/api/auth/login": LOGIN,
      "/api/websites?": {
        body: {
          data: [
            { id: "a", name: "UpSys Consulting", domain: "upsys-consulting.com" },
            { id: "b", name: "Save to ClickUp", domain: "savetoclickup.com" },
          ],
          count: 2,
          page: 1,
          pageSize: 150,
        },
      },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    expect(await client.resolveSiteId("savetoclickup.com")).toBe("b");
    expect(await client.resolveSiteId("upsys")).toBe("a");
    await expect(client.resolveSiteId("nothing")).rejects.toThrow(/No website found/);
  });

  it("creates a website, sends the body, and drops the cached list", async () => {
    const listed = {
      body: { data: [{ id: "a", name: "A", domain: "a.com" }], count: 1, page: 1, pageSize: 150 },
    };
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/api/websites?": listed,
      "/api/websites": { body: { id: "b", name: "B", domain: "b.com" } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getWebsites();
    const created = await client.createWebsite({ name: "B", domain: "b.com" });
    await client.getWebsites();

    expect(created.id).toBe("b");
    const posts = calls.filter((c) => c.method === "POST" && c.url.includes("/api/websites"));
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({ name: "B", domain: "b.com" });
    // The list is re-fetched, because the create invalidated the cache.
    expect(calls.filter((c) => c.url.includes("/api/websites?"))).toHaveLength(2);
  });

  it("only sends teamId when one is given", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/api/websites": { body: { id: "b", name: "B", domain: "b.com" } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.createWebsite({ name: "B", domain: "b.com", teamId: "t1" });

    // The login is a POST too, so the URL is what separates them.
    const posts = calls.filter((c) => c.method === "POST" && c.url.includes("/api/websites"));
    expect(JSON.parse(posts[0]?.body ?? "{}")).toEqual({
      name: "B",
      domain: "b.com",
      teamId: "t1",
    });
  });

  it("deletes a website and drops the cached list", async () => {
    const listed = {
      body: { data: [{ id: "a", name: "A", domain: "a.com" }], count: 1, page: 1, pageSize: 150 },
    };
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/api/websites?": listed,
      "/api/websites/a": { body: "ok" },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getWebsites();
    await client.deleteWebsite("a");
    await client.getWebsites();

    const deletes = calls.filter((c) => c.method === "DELETE");
    expect(deletes).toHaveLength(1);
    expect(deletes[0]?.url).toContain("/api/websites/a");
    // The list is re-fetched because the cache the delete invalidated is gone.
    expect(calls.filter((c) => c.url.includes("/api/websites?"))).toHaveLength(2);
  });
});

describe("UmamiReportingClient reads", () => {
  it("returns stats with the comparison window Umami actually sends", async () => {
    const { impl } = makeFetch({
      "/api/auth/login": LOGIN,
      "/stats": {
        body: {
          pageviews: 37,
          visitors: 31,
          visits: 31,
          bounces: 28,
          totaltime: 147,
          comparison: {
            pageviews: 330,
            visitors: 263,
            visits: 268,
            bounces: 242,
            totaltime: 6264,
          },
        },
      },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    const stats = await client.getStats("site-1", 0, 1);

    expect(stats.pageviews).toBe(37);
    expect(stats.comparison?.pageviews).toBe(330);
  });

  it("url-encodes the timezone on a series read", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/pageviews": { body: { pageviews: [], sessions: [] } },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await client.getPageviews("site-1", 0, 1, "day", "Europe/Lisbon");

    const call = calls.find((c) => c.url.includes("/pageviews"));
    expect(call?.url).toContain("timezone=Europe%2FLisbon");
  });

  it("coerces the string counters Umami returns on expanded metrics", async () => {
    const { impl } = makeFetch({
      "/api/auth/login": LOGIN,
      "/metrics/expanded": {
        body: [
          {
            name: "/pricing",
            pageviews: "42",
            visitors: 30,
            visits: 31,
            bounces: 2,
            totaltime: "90",
          },
        ],
      },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    const [row] = await client.getExpandedMetrics("site-1", "path", 0, 1);

    expect(row.pageviews).toBe(42);
    expect(row.totaltime).toBe(90);
  });

  it("surfaces the failing path in a non-401 API error", async () => {
    const { impl } = makeFetch({
      "/api/auth/login": LOGIN,
      "/stats": { status: 500, body: {} },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    await expect(client.getStats("site-1", 0, 1)).rejects.toThrow(/Umami API error: 500/);
  });
});

describe("UmamiReportingClient event data", () => {
  it("url-encodes an event name that carries a slash or a space", async () => {
    const { impl, calls } = makeFetch({
      "/api/auth/login": LOGIN,
      "/event-data/values": { body: [{ value: "49.00", total: 2 }] },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    const rows = await client.getEventDataValues("site-1", 0, 1, "buy click/pro", "revenue");

    const call = calls.find((c) => c.url.includes("/event-data/values"));
    expect(call?.url).toContain("event=buy+click%2Fpro");
    // The server validates this name and 400s on `property`, which is what the
    // docs call it. Asserted so the docs cannot talk the next pass out of it.
    expect(call?.url).toContain("propertyName=revenue");
    expect(rows).toEqual([{ value: "49.00", total: 2 }]);
  });

  it("lists the recorded event fields", async () => {
    const { impl } = makeFetch({
      "/api/auth/login": LOGIN,
      "/event-data/stats": {
        body: [{ eventName: "buy_click", fieldName: "revenue", total: 8 }],
      },
    });
    const client = new UmamiReportingClient({ ...CREDENTIALS, fetchImpl: impl });

    expect(await client.getEventDataStats("site-1", 0, 1)).toEqual([
      { eventName: "buy_click", fieldName: "revenue", total: 8 },
    ]);
  });
});
