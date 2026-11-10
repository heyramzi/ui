import type { Registry, RegistryComponent } from "#lib/component-registry.js";

// Stateless MCP over Streamable HTTP. A request with `_meta` follows 2026-07-28; `initialize`
// follows 2025-11-25 and earlier, which Claude Code still speaks.

export const MODERN = "2026-07-28";
const LEGACY = new Set(["2025-11-25", "2025-06-18", "2025-03-26"]);
const LATEST_LEGACY = "2025-11-25";
export const SUPPORTED = [MODERN, ...LEGACY];

const META_VERSION = "io.modelcontextprotocol/protocolVersion";
const META_CAPABILITIES = "io.modelcontextprotocol/clientCapabilities";
const META_SERVER = "io.modelcontextprotocol/serverInfo";

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
const HEADER_MISMATCH = -32020;
const UNSUPPORTED_VERSION = -32022;

/** Where the server reads the docs: the built `registry.json` and `.md` pages. */
export type Docs = {
  registry(): Promise<Registry>;
  markdown(slug: string): Promise<string | null>;
};

type Id = string | number;
type Params = Record<string, unknown> & { _meta?: Record<string, unknown> };
type Message = { jsonrpc: "2.0"; id?: Id; method: string; params?: Params };
type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly status = 200,
    readonly data?: unknown,
  ) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

type ErrorBody = {
  jsonrpc: "2.0";
  id?: Id;
  error: { code: number; message: string; data?: unknown };
};

/** An error response; `id` stays out when the request's id couldn't be read. */
function errorBody(id: Id | undefined, code: number, message: string, data?: unknown) {
  const body: ErrorBody = { jsonrpc: "2.0", error: { code, message } };
  if (id !== undefined) body.id = id;
  if (data !== undefined) body.error.data = data;
  return body;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A browser page on another site can't drive the server: only its own origin and localhost. */
function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  const hostname = URL.parse(origin)?.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** An `Mcp-Name` value, after the `=?base64?...?=` sentinel the spec allows for non-ASCII names. */
function decodeHeader(value: string | null): string | null {
  const encoded = value?.match(/^=\?base64\?([A-Za-z0-9+/]*={0,2})\?=$/)?.[1];
  if (encoded === undefined) return value;
  // A length off a multiple of 4 would make `atob` throw; it can't match the body anyway.
  if (encoded.length % 4) return null;
  return new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
}

const NOT_JSON = Symbol("not json");

export async function handleMcp(request: Request, docs: Docs): Promise<Response> {
  if (!originAllowed(request))
    return json(errorBody(undefined, INVALID_REQUEST, "Origin not allowed"), 403);
  // No standalone SSE stream and no sessions to delete, in either era.
  if (request.method !== "POST")
    return new Response(null, { status: 405, headers: { allow: "POST" } });

  const message: unknown = await request.json().catch(() => NOT_JSON);
  if (message === NOT_JSON)
    return json(errorBody(undefined, PARSE_ERROR, "Parse error: the body isn't JSON"), 400);
  if (
    !isRecord(message) ||
    message.jsonrpc !== "2.0" ||
    typeof message.method !== "string" ||
    (message.params !== undefined && !isRecord(message.params))
  )
    return json(
      errorBody(undefined, INVALID_REQUEST, "Invalid request: send one JSON-RPC 2.0 message"),
      400,
    );
  // A notification (`notifications/initialized` from a legacy client) needs nothing back.
  if (!("id" in message)) return new Response(null, { status: 202 });
  const msg = message as Message;
  if (typeof msg.id !== "string" && typeof msg.id !== "number")
    return json(
      errorBody(undefined, INVALID_REQUEST, "Invalid request: id must be a string or number"),
      400,
    );

  const id = msg.id;
  return dispatch(request, msg, docs).then(
    (result) => json({ jsonrpc: "2.0", id, result }),
    (e: unknown) => {
      if (e instanceof RpcError) return json(errorBody(id, e.code, e.message, e.data), e.status);
      console.error("mcp: internal error", e);
      return json(errorBody(id, INTERNAL_ERROR, "Internal error"), 500);
    },
  );
}

function dispatch(request: Request, msg: Message, docs: Docs) {
  const header = request.headers.get("mcp-protocol-version");
  const metaVersion = msg.params?._meta?.[META_VERSION];
  if (msg.method !== "initialize" && (metaVersion !== undefined || header === MODERN))
    return modern(request, msg, docs);
  return legacy(header, msg, docs);
}

const unsupported = (requested: unknown) =>
  new RpcError(UNSUPPORTED_VERSION, "Unsupported protocol version", 400, {
    supported: SUPPORTED,
    requested,
  });

const mismatch = (what: string) => new RpcError(HEADER_MISMATCH, `Header mismatch: ${what}`, 400);

/** Revision 2026-07-28: every request carries its version and capabilities, checked each time. */
async function modern(request: Request, msg: Message, docs: Docs) {
  const meta = msg.params?._meta;
  const version = meta?.[META_VERSION];
  if (typeof version !== "string")
    throw new RpcError(INVALID_PARAMS, `Missing _meta["${META_VERSION}"]`, 400);
  if (request.headers.get("mcp-protocol-version") !== version)
    throw mismatch("MCP-Protocol-Version must match the body's protocol version");
  if (version !== MODERN) throw unsupported(version);
  if (request.headers.get("mcp-method") !== msg.method)
    throw mismatch("Mcp-Method must match the body's method");
  if (!isRecord(meta?.[META_CAPABILITIES]))
    throw new RpcError(INVALID_PARAMS, `Missing _meta["${META_CAPABILITIES}"]`, 400);

  const registry = await docs.registry();
  const done = (result: Record<string, unknown>) => ({
    resultType: "complete",
    ...result,
    _meta: { [META_SERVER]: serverInfo(registry) },
  });
  switch (msg.method) {
    case "server/discover":
      return done({
        supportedVersions: SUPPORTED,
        capabilities: { tools: {} },
        instructions,
        ttlMs: 3_600_000,
        cacheScope: "public",
      });
    case "tools/list":
      return done({ tools: tools(registry), ttlMs: 3_600_000, cacheScope: "public" });
    case "tools/call": {
      const name = msg.params?.name;
      if (decodeHeader(request.headers.get("mcp-name")) !== name)
        throw mismatch("Mcp-Name must match the tool name in the body");
      return done(await callTool(msg.params, registry, docs));
    }
    default:
      throw new RpcError(METHOD_NOT_FOUND, `Method not found: ${msg.method}`, 404);
  }
}

/** 2025-11-25 and earlier: `initialize` negotiates a version, and no session id is minted. */
async function legacy(header: string | null, msg: Message, docs: Docs) {
  if (msg.method === "initialize") {
    const requested = msg.params?.protocolVersion;
    const registry = await docs.registry();
    return {
      protocolVersion:
        typeof requested === "string" && LEGACY.has(requested) ? requested : LATEST_LEGACY,
      capabilities: { tools: { listChanged: false } },
      serverInfo: serverInfo(registry),
      instructions,
    };
  }
  // A missing header is a 2025-03-26 client, which predates it.
  if (header !== null && !LEGACY.has(header)) throw unsupported(header);
  switch (msg.method) {
    case "ping":
      return {};
    case "tools/list":
      return { tools: tools(await docs.registry()) };
    case "tools/call":
      return callTool(msg.params, await docs.registry(), docs);
    default:
      throw new RpcError(METHOD_NOT_FOUND, `Method not found: ${msg.method}`);
  }
}

const serverInfo = (registry: Registry) => ({
  name: "heyramzi-ui",
  title: `${registry.name} docs`,
  version: registry.version,
  websiteUrl: registry.homepage,
});

const instructions =
  "Docs for @heyramzi/ui, a Svelte 5 component library. Find a component with search_components or list_components, then call get_component with its slug for the import line, a working demo and the props table. Each part is imported by its own path, such as @heyramzi/ui/shadcn/button.";

const readOnly = { readOnlyHint: true, openWorldHint: false };

function tools(registry: Registry) {
  return [
    {
      name: "list_components",
      title: "List components",
      description:
        "Every @heyramzi/ui component in docs order: slug, title, section, category, import path and a one-line description. Pass a section to see only that part of the docs.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: registry.sections.map((s) => s.id),
            description: "Only this section of the docs.",
          },
        },
        additionalProperties: false,
      },
      annotations: readOnly,
    },
    {
      name: "search_components",
      title: "Search components",
      description:
        "Find @heyramzi/ui components by what they do or what they're called, such as 'tabs', 'date picker' or 'kanban'. Matches titles, slugs, categories, descriptions and prop names, best match first.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Words to match." } },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: readOnly,
    },
    {
      name: "get_component",
      title: "Get a component",
      description:
        "One @heyramzi/ui component's docs page as Markdown: description, import line, a working Svelte demo and its props table. Take the slug from list_components or search_components.",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "The component's slug, such as 'tabs'." },
        },
        required: ["slug"],
        additionalProperties: false,
      },
      annotations: readOnly,
    },
  ];
}

function text(body: string, isError = false): ToolResult {
  const result: ToolResult = { content: [{ type: "text", text: body }] };
  if (isError) result.isError = true;
  return result;
}

/** One line per component, the shape every list and search answer shares. */
function line(c: RegistryComponent): string {
  const from = c.import ? ` Import from \`${c.import}\`.` : "";
  return `- \`${c.slug}\`: ${c.title} (${c.sectionTitle} / ${c.category}). ${c.description}${from}`;
}

async function callTool(params: Params | undefined, registry: Registry, docs: Docs) {
  const name = params?.name;
  const args = isRecord(params?.arguments) ? params.arguments : {};
  switch (name) {
    case "list_components":
      return listComponents(registry, args.section);
    case "search_components":
      return searchComponents(registry, args.query);
    case "get_component":
      return getComponent(registry, docs, args.slug);
    default:
      throw new RpcError(INVALID_PARAMS, `Unknown tool: ${String(name)}`);
  }
}

function listComponents(registry: Registry, section: unknown): ToolResult {
  if (section !== undefined && !registry.sections.some((s) => s.id === section))
    return text(
      `No section "${String(section)}". Sections: ${registry.sections.map((s) => s.id).join(", ")}.`,
      true,
    );
  const parts: string[] = [];
  for (const s of registry.sections) {
    if (section !== undefined && s.id !== section) continue;
    const inSection = registry.components.filter((c) => c.section === s.id);
    if (!inSection.length) continue;
    parts.push(`## ${s.title} (\`${s.id}\`, ${inSection.length})`, "", ...inSection.map(line), "");
  }
  return text(parts.join("\n").trim());
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

/** Components ranked by how many query words they match, and where: a title hit beats a prop. */
function rank(registry: Registry, query: string): RegistryComponent[] {
  const terms = words(query);
  if (!terms.length) return [];
  const scored = registry.components.map((c) => {
    const name = `${c.slug} ${c.title}`.toLowerCase();
    const place = `${c.category} ${c.sectionTitle}`.toLowerCase();
    const about = c.description.toLowerCase();
    const props = new Set(c.api.flatMap((p) => p.props.map((prop) => prop.name.toLowerCase())));
    let score = 0;
    let matched = 0;
    for (const term of terms) {
      const hit =
        (name.includes(term) ? 6 : 0) +
        (place.includes(term) ? 3 : 0) +
        (about.includes(term) ? 2 : 0) +
        (props.has(term) ? 1 : 0);
      if (hit) matched++;
      score += hit;
    }
    if (name === query.toLowerCase().trim() || c.slug === terms.join("-")) score += 20;
    return { c, score: score * matched };
  });
  return scored
    .filter((s) => s.score > 0)
    .toSorted((a, b) => b.score - a.score)
    .map((s) => s.c);
}

function searchComponents(registry: Registry, query: unknown): ToolResult {
  if (typeof query !== "string" || !words(query).length)
    return text("Pass a query with at least one word, such as 'tabs'.", true);
  const found = rank(registry, query).slice(0, 10);
  if (!found.length)
    return text(`Nothing matches "${query}". Call list_components to see every component.`);
  return text(
    [
      `${found.length} match${found.length === 1 ? "" : "es"} for "${query}", best first:`,
      "",
      ...found.map(line),
      "",
      "Call get_component with a slug for its demo and props.",
    ].join("\n"),
  );
}

async function getComponent(registry: Registry, docs: Docs, slug: unknown): Promise<ToolResult> {
  if (typeof slug !== "string" || !slug.trim())
    return text("Pass the component's slug, such as 'tabs'.", true);
  const key = slug.trim().toLowerCase();
  const component = registry.components.find(
    (c) => c.slug === key || c.title.toLowerCase() === key,
  );
  if (!component) {
    const near = rank(registry, slug)
      .slice(0, 5)
      .map((c) => `\`${c.slug}\``);
    const hint = near.length ? ` Closest: ${near.join(", ")}.` : "";
    return text(`No component "${slug}".${hint}`, true);
  }
  const page = await docs.markdown(component.slug);
  if (page === null) throw new Error(`mcp: ${component.markdown} is missing from the build`);
  return text(page);
}

/** The docs read from the Worker's static assets, so the server and the site share one build. */
export function assetDocs(assets: { fetch: typeof fetch }, origin: string): Docs {
  return {
    registry() {
      registryOnce ??= assets
        .fetch(new URL("/registry.json", origin))
        .then((res) => {
          if (!res.ok) throw new Error(`mcp: /registry.json answered ${res.status}`);
          return res.json() as Promise<Registry>;
        })
        .catch((e) => {
          registryOnce = undefined;
          throw e;
        });
      return registryOnce;
    },
    async markdown(slug) {
      const res = await assets.fetch(new URL(`/components/${encodeURIComponent(slug)}.md`, origin));
      return res.ok ? res.text() : null;
    },
  };
}

// One parse per isolate: the assets only change with a deploy, which starts a new isolate.
let registryOnce: Promise<Registry> | undefined;
