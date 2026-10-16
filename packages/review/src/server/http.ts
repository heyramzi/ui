/**
 * The plumbing every review server needs: ranged file reads, a set of server-sent-event clients,
 * a capped body read and a JSON answer.
 */
import { createReadStream, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname } from "node:path";

export type Range = {
  status: 200 | 206;
  start: number;
  end: number;
  headers: Record<string, string>;
};

/**
 * A video served whole can't seek. Returns null for a range the file can't satisfy (416).
 */
export function rangeHeaders(size: number, header: string | undefined): Range | null {
  const base = { "accept-ranges": "bytes" };
  if (!header)
    return {
      status: 200,
      start: 0,
      end: size - 1,
      headers: { ...base, "content-length": String(size) },
    };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size === 0) return null;
  const [, rawStart = "", rawEnd = ""] = match;
  let start: number;
  let end: number;
  if (rawStart === "") {
    // WHY: "bytes=-500" means the last 500 bytes.
    const tail = Number(rawEnd);
    if (!tail) return null;
    start = Math.max(size - tail, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }
  if (start > end || start >= size) return null;
  return {
    status: 206,
    start,
    end,
    headers: {
      ...base,
      "content-range": `bytes ${start}-${end}/${size}`,
      "content-length": String(end - start + 1),
    },
  };
}

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export const contentTypeOf = (path: string): string =>
  TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";

/** Stream a file with range support. Answers 404 for a missing file and 416 for a bad range. */
export function serveRange(
  request: IncomingMessage,
  response: ServerResponse,
  path: string,
  contentType = contentTypeOf(path),
): void {
  let size: number;
  try {
    const stat = statSync(path);
    if (!stat.isFile()) throw new Error("not a file");
    size = stat.size;
  } catch {
    response.writeHead(404).end();
    return;
  }
  const range = rangeHeaders(size, request.headers.range);
  if (!range) {
    response.writeHead(416, { "content-range": `bytes */${size}` }).end();
    return;
  }
  response.writeHead(range.status, {
    ...range.headers,
    "content-type": contentType,
    "cache-control": "no-cache",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  const stream = createReadStream(path, { start: range.start, end: range.end });
  stream.on("error", () => response.destroy());
  response.on("close", () => stream.destroy());
  stream.pipe(response);
}

/** `Events` names each event and the body it carries, so a host checks every send against its pages. */
export type Broadcaster<Events extends object = Record<string, unknown>> = {
  add(response: ServerResponse, first?: string): void;
  send<Name extends keyof Events & string>(event: Name, data: Events[Name]): void;
  count(): number;
  /** End every open stream. */
  close(): void;
};

/** A set of SSE clients with a heartbeat, so a proxy or a sleeping laptop notices a dead one. */
export function broadcaster<Events extends object = Record<string, unknown>>(
  heartbeatMs = 15_000,
): Broadcaster<Events> {
  const clients = new Set<ServerResponse>();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => {
    if (timer && clients.size === 0) clearInterval(timer);
    if (clients.size === 0) timer = undefined;
  };
  return {
    add(response, first) {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      });
      response.write(`retry: 2000\n${first ?? ""}\n`);
      clients.add(response);
      response.on("close", () => {
        clients.delete(response);
        stop();
      });
      timer ??= setInterval(() => {
        for (const client of clients) client.write(": ping\n\n");
      }, heartbeatMs).unref();
    },
    send(event, data) {
      const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const client of clients) client.write(line);
    },
    count: () => clients.size,
    close() {
      for (const client of clients) client.end();
      clients.clear();
      stop();
    },
  };
}

/**
 * The request body, or null when it ran past `max` bytes. The rest is read and dropped, not cut
 * off, so the 413 still reaches a client that is mid-upload.
 */
export async function readBytes(request: IncomingMessage, max: number): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size <= max) chunks.push(buffer);
  }
  return size > max ? null : Buffer.concat(chunks);
}

/** The body as text, or null past `max` bytes. */
export async function readBody(request: IncomingMessage, max: number): Promise<string | null> {
  return (await readBytes(request, max))?.toString("utf8") ?? null;
}

/** One JSON answer. `headers` replace the defaults of the same name, such as a route's own cache rule. */
export function json(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(body));
}
