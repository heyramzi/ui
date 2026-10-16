import { readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import type { Plugin } from "vite-plus";
import { createReviewHandler } from "#src/server/index.js";
import { createDevAdapter, FIXTURE_IDS } from "#dev/adapter.js";

// A sibling vibe-kit checkout, if there is one. Without it the dev page falls back to system fonts.
const STUDIO_CSS =
  process.env.STUDIO_CSS ??
  new URL("../../../../vibe-kit/packages/studio/src/studio.css", import.meta.url).pathname;
export const BASE = "/review";

/** The brand fonts sit in the studio stylesheet as data URIs. The dev page borrows only its @font-face blocks. */
function fonts(): string {
  try {
    return (
      readFileSync(STUDIO_CSS, "utf8")
        .match(/@font-face\s*\{[^}]*\}/g)
        ?.join("\n") ?? ""
    );
  } catch {
    return "";
  }
}

/** Mounts the real review handler as middleware, plus a switch to cut the event stream for the offline test. */
export function reviewDevServer(): Plugin {
  return {
    name: "review-dev-server",
    apply: "serve",
    configureServer(server) {
      const adapter = createDevAdapter(BASE);
      const handler = createReviewHandler(adapter, { base: BASE, heartbeatMs: 5000 });
      const streams = new Set<ServerResponse>();
      let streamsDown = false;
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url === "/__dev/fixtures") {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(FIXTURE_IDS));
          return;
        }
        if (url === "/__dev/reset") {
          adapter.reset();
          res.end("ok");
          return;
        }
        if (url === "/__dev/fonts.css") {
          res.setHeader("content-type", "text/css");
          res.end(fonts());
          return;
        }
        // Worker C's gate route doesn't exist here. A query overrides it, so a test can flip it.
        if (url.startsWith("/features")) {
          const asked = new URL(url, "http://localhost").searchParams.get("__dev");
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ openscreen: asked === "on", openscreenInstalled: false }));
          return;
        }
        if (url.startsWith("/__dev/events/")) {
          streamsDown = url.endsWith("/stop");
          if (streamsDown) for (const stream of streams) stream.destroy();
          res.end("ok");
          return;
        }
        if (url.includes("/events")) {
          if (streamsDown) {
            res.writeHead(503).end();
            return;
          }
          streams.add(res);
          res.on("close", () => streams.delete(res));
        }
        if (!handler(req, res)) next();
      });
    },
  };
}
