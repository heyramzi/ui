// Serves site/build like the Cloudflare assets binding: /a/b answers a/b.html or a/b/index.html,
// anything else gets 404.html with a 404.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../build/", import.meta.url));
const port = Number(process.env.GALLERY_PORT);
if (!port) throw new Error("serve.mjs: set GALLERY_PORT");

/** @type {Record<string, string>} */
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/** @param {string} file */
const isFile = (file) =>
  stat(file).then(
    (s) => s.isFile(),
    () => false,
  );

/** @param {string} pathname */
async function resolve(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = join(root, rel);
  if (!base.startsWith(root.slice(0, -1))) return null;
  const candidates = [base, `${base}.html`, join(base, "index.html")];
  const found = await Promise.all(candidates.map(isFile));
  return candidates[found.indexOf(true)] ?? null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = await resolve(pathname);
  const status = file ? 200 : 404;
  const body = await readFile(file ?? join(root, "404.html"));
  res.writeHead(status, {
    "content-type": types[extname(file ?? ".html")] ?? "application/octet-stream",
  });
  res.end(body);
}).listen(port, "127.0.0.1", () => {
  console.log(`gallery: serving ${root} on http://127.0.0.1:${port}`);
});
