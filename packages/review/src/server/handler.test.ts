import { createServer, type Server } from "node:http";
import { connect, type AddressInfo } from "node:net";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import type { ReviewAction, ReviewAdapter, ReviewModel } from "#src/core/types.js";
import { createReviewHandler, ReviewError } from "#src/server/index.js";
import { must } from "#src/test-support.js";

const model: ReviewModel = {
  id: "v1",
  title: "T",
  route: "R",
  status: { tone: "neutral", text: "ok" },
  groups: [],
  passes: [],
  kinds: [],
  paragraphs: [],
  beats: [],
  notes: [],
  session: "idle",
};

const dir = mkdtempSync(join(tmpdir(), "review-"));
const file = join(dir, "clip.bin");
writeFileSync(file, Buffer.from("0123456789"));

const seen: ReviewAction[] = [];
let ping: (() => void) | undefined;
const adapter: ReviewAdapter = {
  async load(id) {
    if (id === "missing") throw new ReviewError("No such video.", 404);
    return { ...model, id };
  },
  async act(_id, action) {
    seen.push(action);
    return { ok: true };
  },
  media: (_id, name) => (name === "clip.bin" ? file : null),
  async library(id) {
    if (id === "missing") throw new ReviewError("No such video.", 404);
    return id === "bare"
      ? []
      : [{ id: "motion", label: "Motion", items: [{ id: "pop", name: "Pop in" }] }];
  },
  watch(_id, changed) {
    ping = changed;
    return () => (ping = undefined);
  },
};

let server: Server;
let url = "";
beforeAll(async () => {
  const handler = createReviewHandler(adapter, { base: "/review", heartbeatMs: 50 });
  server = createServer((req, res) => {
    if (!handler(req, res)) res.writeHead(418).end();
  });
  await new Promise<void>((done) => server.listen(0, done));
  url = `http://localhost:${(server.address() as AddressInfo).port}`;
});
afterAll(() => {
  server.closeAllConnections();
  server.close();
});

const post = (body: unknown, type = "application/json") =>
  fetch(`${url}/review/v1/act`, {
    method: "POST",
    headers: { "content-type": type },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("createReviewHandler", () => {
  it("returns false for a path that isn't its own", async () => {
    expect((await fetch(`${url}/other`)).status).toBe(418);
  });
  it("serves the state", async () => {
    const res = await fetch(`${url}/review/v1/state`);
    expect(res.status).toBe(200);
    expect(((await res.json()) as ReviewModel).id).toBe("v1");
  });
  it("answers a ReviewError with its status", async () => {
    expect((await fetch(`${url}/review/missing/state`)).status).toBe(404);
  });
  it("passes a valid action to the adapter", async () => {
    const res = await post({ type: "decide", beat: "b1", state: "approved" });
    expect(res.status).toBe(200);
    expect(seen.at(-1)).toEqual({ type: "decide", beat: "b1", state: "approved" });
  });
  it.each([
    ["an unknown type", { type: "nope" }],
    ["a bad beat state", { type: "decide", beat: "b", state: "maybe" }],
    ["an empty note", { type: "note", target: { kind: "video" }, text: "  " }],
    [
      "a frame outside the picture",
      { type: "note", target: { kind: "time", at: 1, frame: { x: 2, y: 0 } }, text: "x" },
    ],
    ["a music action with nothing in it", { type: "music" }],
  ])("answers 400 for %s", async (_name, body) => {
    expect((await post(body)).status).toBe(400);
  });
  it("answers 400 for broken JSON and 415 for the wrong type", async () => {
    expect((await post("{nope")).status).toBe(400);
    expect((await post({ type: "refresh" }, "text/plain")).status).toBe(415);
  });
  it("answers 415 when application/json is only a parameter", async () => {
    expect((await post({ type: "refresh" }, "text/plain; x=application/json")).status).toBe(415);
  });
  it("still reads JSON with a charset", async () => {
    expect((await post({ type: "refresh" }, "application/json; charset=utf-8")).status).toBe(200);
  });
  const postFrom = (origin: string) =>
    fetch(`${url}/review/v1/act`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ type: "refresh" }),
    });
  it("refuses a write from another origin", async () => {
    const before = seen.length;
    expect((await postFrom("https://elsewhere.example")).status).toBe(403);
    expect(seen.length).toBe(before);
  });
  it("takes a write from its own origin and from a client that sends none", async () => {
    expect((await postFrom(url)).status).toBe(200);
    expect((await post({ type: "refresh" })).status).toBe(200);
  });
  it("stays up when a client drops mid-upload", async () => {
    const socket = connect((server.address() as AddressInfo).port, "localhost");
    await new Promise<void>((done) => socket.once("connect", done));
    // Let the server start reading the body before the client vanishes.
    await new Promise<void>((done) =>
      socket.write(
        'POST /review/v1/act HTTP/1.1\r\nhost: localhost\r\ncontent-type: application/json\r\ncontent-length: 1000\r\n\r\n{"type":',
        () => setTimeout(done, 20),
      ),
    );
    socket.destroy();
    await new Promise((done) => setTimeout(done, 50));
    expect((await fetch(`${url}/review/v1/state`)).status).toBe(200);
  });
  it("serves the library, and an empty one when the adapter has none", async () => {
    const res = await fetch(`${url}/review/v1/library`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { id: "motion", label: "Motion", items: [{ id: "pop", name: "Pop in" }] },
    ]);
    expect(await (await fetch(`${url}/review/bare/library`)).json()).toEqual([]);
    expect((await fetch(`${url}/review/missing/library`)).status).toBe(404);
    expect((await fetch(`${url}/review/v1/library`, { method: "POST" })).status).toBe(405);
  });
  it("accepts a time note with an anchor and refuses a broken one", async () => {
    const target = { kind: "time", at: 2, span: 1, anchor: { source: "take-1", at: 9.5 } };
    expect((await post({ type: "note", target, text: "x" })).status).toBe(200);
    expect(seen.at(-1)).toMatchObject({ target });
    expect(
      (
        await post({
          type: "note",
          target: { ...target, anchor: { source: "", at: 1 } },
          text: "x",
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await post({
          type: "note",
          target: { ...target, anchor: { source: "a", at: -1 } },
          text: "x",
        })
      ).status,
    ).toBe(400);
  });
  it("serves ranges", async () => {
    const res = await fetch(`${url}/review/v1/media?file=clip.bin`, {
      headers: { range: "bytes=2-5" },
    });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(await res.text()).toBe("2345");
    expect(
      (await fetch(`${url}/review/v1/media?file=clip.bin`, { headers: { range: "bytes=50-60" } }))
        .status,
    ).toBe(416);
    expect((await fetch(`${url}/review/v1/media?file=other`)).status).toBe(404);
  });
  it("pushes the model over SSE when the adapter says it changed", async () => {
    const res = await fetch(`${url}/review/v1/events`);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    const reader = must(res.body, "an event stream body").getReader();
    const decoder = new TextDecoder();
    let text = "";
    const until = async (needle: string) => {
      while (!text.includes(needle)) text += decoder.decode((await reader.read()).value);
    };
    await until("event: model");
    text = "";
    ping?.();
    await until("event: model");
    await until(": ping");
    await reader.cancel();
  });
});
