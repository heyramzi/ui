import type { IncomingMessage, ServerResponse } from "node:http";
import type { ReviewAdapter, ReviewModel } from "#src/core/types.js";
import { ReviewError } from "#src/server/errors.js";
import { parseAction } from "#src/server/guards.js";
import { broadcaster, json, readBody, serveRange, type Broadcaster } from "#src/server/http.js";

export type ReviewHandlerOptions = {
  /** The URL prefix, e.g. "/review". */
  base: string;
  heartbeatMs?: number;
  /** Largest POST body in bytes. */
  maxBody?: number;
};

export type ReviewHandler = (request: IncomingMessage, response: ServerResponse) => boolean;

const ID = /^[\w.-]{1,120}$/;

const problem = (response: ServerResponse, status: number, error: string) =>
  json(response, status, { ok: false, error });

function fail(response: ServerResponse, error: unknown): void {
  if (error instanceof ReviewError) return problem(response, error.status, error.message);
  console.error("[review]", error);
  problem(response, 500, "Couldn't read this video.");
}

/**
 * Serves state, act, events, media and library. Returns false for any other path.
 */
export function createReviewHandler(
  adapter: ReviewAdapter,
  options: ReviewHandlerOptions,
): ReviewHandler {
  const base = options.base.replace(/\/+$/, "");
  const maxBody = options.maxBody ?? 256 * 1024;
  const streams = new Map<string, { cast: Broadcaster; unwatch: () => void }>();

  /** One watch and one reload per video, however many pages are open on it. */
  function stream(id: string) {
    const existing = streams.get(id);
    if (existing) return existing;
    const cast = broadcaster(options.heartbeatMs);
    let loading = false;
    let dirty = false;
    const push = async (): Promise<void> => {
      if (loading) {
        dirty = true;
        return;
      }
      loading = true;
      try {
        cast.send("model", await adapter.load(id));
      } catch (error) {
        cast.send("problem", {
          error: error instanceof Error ? error.message : "Couldn't read the video.",
        });
      } finally {
        loading = false;
        if (dirty) {
          dirty = false;
          void push();
        }
      }
    };
    const entry = { cast, unwatch: adapter.watch(id, () => void push()) };
    streams.set(id, entry);
    return entry;
  }

  async function events(
    request: IncomingMessage,
    response: ServerResponse,
    id: string,
  ): Promise<void> {
    let model: ReviewModel;
    try {
      model = await adapter.load(id);
    } catch (error) {
      return fail(response, error);
    }
    const entry = stream(id);
    entry.cast.add(response, `event: model\ndata: ${JSON.stringify(model)}\n\n`);
    request.on("close", () => {
      if (entry.cast.count() > 0) return;
      entry.unwatch();
      streams.delete(id);
    });
  }

  async function act(
    request: IncomingMessage,
    response: ServerResponse,
    id: string,
  ): Promise<void> {
    if (!String(request.headers["content-type"] ?? "").includes("application/json")) {
      return problem(response, 415, "Send JSON.");
    }
    const raw = await readBody(request, maxBody);
    if (raw === null) return problem(response, 413, "That note is too long.");
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return problem(response, 400, "That isn't JSON.");
    }
    const action = parseAction(body);
    if (!action) return problem(response, 400, "That isn't an action this page knows.");
    try {
      const result = await adapter.act(id, action);
      json(response, result.ok ? 200 : 422, result);
    } catch (error) {
      fail(response, error);
    }
  }

  return (request, response) => {
    const url = new URL(request.url ?? "/", "http://review.local");
    if (!url.pathname.startsWith(`${base}/`)) return false;
    const [rawId = "", route = "", ...rest] = url.pathname.slice(base.length + 1).split("/");
    let id: string;
    try {
      id = decodeURIComponent(rawId);
    } catch {
      problem(response, 400, "Bad video id.");
      return true;
    }
    if (!ID.test(id) || rest.length > 0) {
      problem(response, 404, "Not a review route.");
      return true;
    }
    const method = request.method ?? "GET";
    const reading = method === "GET" || method === "HEAD";

    if (route === "state" && reading) {
      adapter.load(id).then(
        (model) => json(response, 200, model),
        (error: unknown) => fail(response, error),
      );
    } else if (route === "events" && method === "GET") {
      void events(request, response, id);
    } else if (route === "media" && reading) {
      const file = url.searchParams.get("file");
      const path = file ? adapter.media(id, file) : null;
      if (path) serveRange(request, response, path);
      else problem(response, 404, "No such file.");
    } else if (route === "library" && reading) {
      Promise.resolve(adapter.library?.(id) ?? []).then(
        (shelves) => json(response, 200, shelves),
        (error: unknown) => fail(response, error),
      );
    } else if (route === "act" && method === "POST") {
      void act(request, response, id);
    } else if (["state", "events", "media", "act", "library"].includes(route)) {
      response.setHeader("allow", route === "act" ? "POST" : "GET");
      problem(response, 405, "Wrong method.");
    } else {
      problem(response, 404, "Not a review route.");
    }
    return true;
  };
}
