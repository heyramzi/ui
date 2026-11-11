import { describe, expect, it } from "vite-plus/test";
import { flagAssets } from "#src/vite/flags.js";

type Server = Parameters<ReturnType<typeof flagAssets>["configureServer"]>[0];
type Handler = Parameters<Server["middlewares"]["use"]>[0];

const connectApp = () => {};

describe("flagAssets", () => {
  it("adds its middleware and hands Vite no post hook", () => {
    const handlers: Handler[] = [];
    // Connect's use() returns the app, and Vite calls a function returned from configureServer
    // with no request: that crashed every dev server and vitest run.
    const server = { middlewares: { use: (fn: Handler) => (handlers.push(fn), connectApp) } };
    expect(flagAssets().configureServer(server)).toBeUndefined();
    expect(handlers).toHaveLength(1);
  });

  it("serves a known flag and passes anything else on", () => {
    const handlers: Handler[] = [];
    flagAssets().configureServer({ middlewares: { use: (fn: Handler) => handlers.push(fn) } });
    const sent: { type?: string; body?: Buffer } = {};
    const res = {
      setHeader: (name: string, value: string) => {
        if (name === "Content-Type") sent.type = value;
      },
      end: (body: Buffer) => {
        sent.body = body;
      },
    };
    let passed = 0;
    handlers[0]({ url: "/flags/XK.svg?v=1" }, res, () => passed++);
    handlers[0]({ url: "/flags/../package.json" }, res, () => passed++);
    expect(sent.type).toBe("image/svg+xml");
    expect(sent.body?.toString()).toContain("<svg");
    expect(passed).toBe(1);
  });
});
