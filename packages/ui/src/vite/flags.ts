import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Next = (err?: unknown) => void;
type Req = { url?: string };
type Res = { setHeader(name: string, value: string): void; end(body: Buffer): void };
type Server = { middlewares: { use(fn: (req: Req, res: Res, next: Next) => void): void } };
type BuildContext = {
  environment?: { config?: { consumer?: string } };
  emitFile(file: { type: "asset"; fileName: string; source: Buffer }): string;
};

// From src/vite in the repo, or dist/vite in the published package.
const here = dirname(fileURLToPath(import.meta.url));
const FLAGS_DIR = [
  join(here, "../components/flag/flags"),
  join(here, "../../src/components/flag/flags"),
].find((dir) => existsSync(dir));

/**
 * Serves the `Flag` SVGs at `/flags/<CODE>.svg`: from the package in dev and preview, and as
 * one static file each in the client build. Add it to `plugins` in `vite.config.ts`.
 */
export function flagAssets(options: { base?: string } = {}) {
  const base = (options.base ?? "/flags").replace(/\/$/, "");
  if (!FLAGS_DIR) throw new Error("@heyramzi/ui: the flag SVGs are missing from the package");
  const dir = FLAGS_DIR;
  const files = readdirSync(dir).filter((name) => /^[A-Z]{2}\.svg$/.test(name));
  const known = new Set(files);
  let ssrBuild = false;

  const serve = (server: Server) =>
    server.middlewares.use((req, res, next) => {
      const path = req.url?.split("?")[0] ?? "";
      const name = path.startsWith(`${base}/`) ? path.slice(base.length + 1) : "";
      if (!known.has(name)) return next();
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.end(readFileSync(join(dir, name)));
    });

  return {
    name: "heyramzi-ui:flags",
    configResolved(config: { build: { ssr: boolean | string } }) {
      ssrBuild = Boolean(config.build.ssr);
    },
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle(this: BuildContext) {
      const consumer = this.environment?.config?.consumer;
      if (consumer ? consumer !== "client" : ssrBuild) return;
      for (const name of files)
        this.emitFile({
          type: "asset",
          fileName: `${base.replace(/^\//, "")}/${name}`,
          source: readFileSync(join(dir, name)),
        });
    },
  };
}
