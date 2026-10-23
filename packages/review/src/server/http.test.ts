import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";
import { json, readBody, readBytes } from "#src/server/index.js";

let server: Server;
let url = "";
beforeAll(async () => {
  server = createServer(async (request, response) => {
    if (request.url === "/bytes") {
      const bytes = await readBytes(request, 1000);
      return json(response, 200, { hex: bytes?.toString("hex") ?? null });
    }
    const raw = await readBody(request, 10);
    if (raw === null) return json(response, 413, { error: "too big" });
    json(response, 200, { raw }, { "cache-control": "no-cache" });
  });
  await new Promise<void>((done) => server.listen(0, done));
  url = `http://localhost:${(server.address() as AddressInfo).port}`;
});
afterAll(() => {
  server.closeAllConnections();
  server.close();
});

describe("readBody and json", () => {
  it("reads a body under the cap whole", async () => {
    const res = await fetch(url, { method: "POST", body: "hello" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ raw: "hello" });
  });

  it("answers an over-cap body with its 413 instead of dropping the connection", async () => {
    const res = await fetch(url, { method: "POST", body: "x".repeat(5000) });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "too big" });
  });

  it("keeps binary bytes as they came", async () => {
    const res = await fetch(`${url}/bytes`, {
      method: "POST",
      body: new Uint8Array([0x25, 0x50, 0xff, 0x00]),
    });
    expect(await res.json()).toEqual({ hex: "2550ff00" });
  });

  it("sends JSON with no-store unless a header says otherwise", async () => {
    const small = await fetch(url, { method: "POST", body: "{}" });
    expect(small.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(small.headers.get("cache-control")).toBe("no-cache");
    const big = await fetch(url, { method: "POST", body: "x".repeat(50) });
    expect(big.headers.get("cache-control")).toBe("no-store");
  });
});
