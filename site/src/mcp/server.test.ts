import { describe, expect, it } from "vite-plus/test";
import type { Registry } from "#lib/component-registry.js";
import { handleMcp, MODERN, type Docs } from "#src/mcp/server.js";

// Cases follow the MCP spec's Streamable HTTP page (revisions 2026-07-28 and 2025-11-25).

const registry: Registry = {
  name: "@heyramzi/ui",
  version: "9.9.9",
  homepage: "https://ui.heyramzi.com",
  llms: "https://ui.heyramzi.com/llms.txt",
  llmsFull: "https://ui.heyramzi.com/llms-full.txt",
  mcp: "https://ui.heyramzi.com/mcp",
  sections: [
    { id: "components", title: "Components", categories: ["Navigation"] },
    { id: "charts", title: "Charts", categories: ["Charts"] },
  ],
  components: [
    {
      slug: "tabs",
      title: "Tabs",
      description: "Switch between views.",
      section: "components",
      sectionTitle: "Components",
      category: "Navigation",
      import: "@heyramzi/ui/shadcn/tabs",
      docs: "https://ui.heyramzi.com/components/tabs",
      markdown: "https://ui.heyramzi.com/components/tabs.md",
      api: [{ name: "Tabs.Root", file: "tabs.svelte", props: [{ name: "value" }], bases: [] }],
    },
    {
      slug: "bar-chart",
      title: "Bar chart",
      description: "Bars for categories.",
      section: "charts",
      sectionTitle: "Charts",
      category: "Charts",
      import: "@heyramzi/ui/charts",
      docs: "https://ui.heyramzi.com/components/bar-chart",
      markdown: "https://ui.heyramzi.com/components/bar-chart.md",
      api: [],
    },
  ],
};

const docs: Docs = {
  registry: async () => registry,
  markdown: async (slug) => (slug === "tabs" ? "# Tabs\n\nThe page." : null),
};

const ENDPOINT = "https://ui.heyramzi.com/mcp";

function post(body: unknown, headers: Record<string, string> = {}) {
  return handleMcp(
    new Request(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    docs,
  );
}

const meta = {
  "io.modelcontextprotocol/protocolVersion": MODERN,
  "io.modelcontextprotocol/clientCapabilities": {},
};

/** A modern request with its body fields mirrored into headers, as the spec requires. */
function modern(method: string, params: Record<string, unknown> = {}, extra = {}) {
  const headers: Record<string, string> = {
    "mcp-protocol-version": MODERN,
    "mcp-method": method,
    ...extra,
  };
  if (typeof params.name === "string" && !("mcp-name" in extra)) headers["mcp-name"] = params.name;
  return post({ jsonrpc: "2.0", id: 1, method, params: { ...params, _meta: meta } }, headers);
}

describe("clients that open with initialize", () => {
  it("negotiates the client's version and mints no session id", async () => {
    const res = await post({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t" } },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("mcp-session-id")).toBeNull();
    const { result } = await res.json();
    expect(result.protocolVersion).toBe("2025-06-18");
    expect(result.capabilities.tools).toBeDefined();
    expect(result.serverInfo.version).toBe("9.9.9");
  });

  it("answers a version it doesn't know with its latest handshake one", async () => {
    const res = await post({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: { protocolVersion: "2024-01-01", capabilities: {} },
    });
    expect((await res.json()).result.protocolVersion).toBe("2025-11-25");
  });

  it("accepts a notification with 202 and no body", async () => {
    const res = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("answers ping, tools/list and tools/call", async () => {
    const h = { "mcp-protocol-version": "2025-11-25" };
    const ping = await (await post({ jsonrpc: "2.0", id: 1, method: "ping" }, h)).json();
    expect(ping.result).toEqual({});
    const list = await (await post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, h)).json();
    expect(list.result.tools.map((t: { name: string }) => t.name)).toEqual([
      "list_components",
      "search_components",
      "get_component",
    ]);
    const call = await (
      await post(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "get_component", arguments: { slug: "tabs" } },
        },
        h,
      )
    ).json();
    expect(call.result.content[0].text).toBe("# Tabs\n\nThe page.");
  });

  it("refuses an MCP-Protocol-Version it doesn't serve with 400", async () => {
    const res = await post(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { "mcp-protocol-version": "2099-01-01" },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32022);
  });
});

describe("modern clients (per-request _meta)", () => {
  it("discovers versions and capabilities", async () => {
    const { result } = await (await modern("server/discover")).json();
    expect(result.resultType).toBe("complete");
    expect(result.supportedVersions).toContain(MODERN);
    expect(result.supportedVersions).toContain("2025-11-25");
    expect(result._meta["io.modelcontextprotocol/serverInfo"].name).toBe("heyramzi-ui");
  });

  it("lists tools as a cacheable result", async () => {
    const { result } = await (await modern("tools/list")).json();
    expect(result.resultType).toBe("complete");
    expect(result.cacheScope).toBe("public");
    expect(result.ttlMs).toBeGreaterThan(0);
    expect(result.tools[0].inputSchema.properties.section.enum).toEqual(["components", "charts"]);
  });

  it("lists one section's components", async () => {
    const { result } = await (
      await modern("tools/call", { name: "list_components", arguments: { section: "charts" } })
    ).json();
    expect(result.content[0].text).toContain("`bar-chart`");
    expect(result.content[0].text).not.toContain("`tabs`");
  });

  it("searches by title and by prop name", async () => {
    const call = (query: string) =>
      modern("tools/call", { name: "search_components", arguments: { query } }).then((r) =>
        r.json(),
      );
    expect((await call("bar")).result.content[0].text).toContain("`bar-chart`");
    expect((await call("value")).result.content[0].text).toContain("`tabs`");
  });

  it("returns a tool error, not a protocol error, for an unknown slug", async () => {
    const { result } = await (
      await modern("tools/call", { name: "get_component", arguments: { slug: "tab" } })
    ).json();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("`tabs`");
  });

  it("rejects an Mcp-Name that doesn't match the body with HeaderMismatch", async () => {
    const res = await modern(
      "tools/call",
      { name: "get_component", arguments: { slug: "tabs" } },
      { "mcp-name": "list_components" },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32020);
  });

  it("decodes a base64 Mcp-Name before comparing", async () => {
    const res = await modern(
      "tools/call",
      { name: "get_component", arguments: { slug: "tabs" } },
      { "mcp-name": `=?base64?${btoa("get_component")}?=` },
    );
    expect(res.status).toBe(200);
  });

  it("rejects a missing protocol version header with HeaderMismatch", async () => {
    const res = await post({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: { _meta: meta },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32020);
  });

  it("lists its versions when the requested one is unsupported", async () => {
    const res = await post(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: { _meta: { ...meta, "io.modelcontextprotocol/protocolVersion": "1900-01-01" } },
      },
      { "mcp-protocol-version": "1900-01-01", "mcp-method": "tools/list" },
    );
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(error.code).toBe(-32022);
    expect(error.data).toEqual({
      supported: expect.arrayContaining([MODERN]),
      requested: "1900-01-01",
    });
  });

  it("rejects a request without client capabilities with Invalid params", async () => {
    const res = await post(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: { _meta: { "io.modelcontextprotocol/protocolVersion": MODERN } },
      },
      { "mcp-protocol-version": MODERN, "mcp-method": "tools/list" },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32602);
  });

  it("answers an unknown method with 404 and Method not found", async () => {
    const res = await modern("ping");
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe(-32601);
  });
});

describe("transport", () => {
  it("refuses GET and DELETE with 405", async () => {
    const answers = await Promise.all(
      ["GET", "DELETE"].map((method) => handleMcp(new Request(ENDPOINT, { method }), docs)),
    );
    for (const res of answers) {
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("POST");
    }
  });

  it("refuses another site's Origin with 403", async () => {
    const res = await post(
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { origin: "https://evil.example" },
    );
    expect(res.status).toBe(403);
  });

  it("answers a body that isn't JSON with a parse error", async () => {
    const res = await post("{nope");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32700);
  });

  it("refuses a batch", async () => {
    const res = await post([{ jsonrpc: "2.0", id: 1, method: "ping" }]);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32600);
  });
});
