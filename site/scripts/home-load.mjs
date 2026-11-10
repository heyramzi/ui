// Home first load: the gzip size of every JS and CSS file the built `/` page fetches untouched.
// After `pnpm --filter site build`: node site/scripts/home-load.mjs [build dir] [--static] [--json]
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const args = process.argv.slice(2);
const json = args.includes("--json");
const staticOnly = args.includes("--static");
const buildDir = resolve(
  args.find((a) => !a.startsWith("--")) ??
    join(dirname(fileURLToPath(import.meta.url)), "..", "build"),
);
const indexPath = join(buildDir, "index.html");
if (!existsSync(indexPath)) {
  console.error(`No ${indexPath}. Build first: pnpm --filter site build`);
  process.exit(1);
}

const files = staticOnly ? staticGraph() : await browserLoad();
const rows = [...files]
  .map((file) => ({ file: relative(buildDir, file), gzip: gzipSync(readFileSync(file)).length }))
  .toSorted((a, b) => b.gzip - a.gzip);
const totalKb = Math.round(rows.reduce((sum, r) => sum + r.gzip, 0) / 1024);

if (json) {
  console.log(JSON.stringify({ files: rows.length, totalKb, rows }, null, 2));
} else {
  for (const r of rows) console.log(`${(r.gzip / 1024).toFixed(1).padStart(7)} KB  ${r.file}`);
  const how = staticOnly ? ", static imports" : "";
  console.log(`Home first load${how}: ${rows.length} files, ${totalKb} KB gzip`);
}

// `--static`: index.html's preloads, stylesheets and boot imports, then their static imports.
function staticGraph() {
  const html = readFileSync(indexPath, "utf8");
  const seeds = new Set();
  for (const tag of html.match(/<link\b[^>]*>/g) ?? []) {
    const rel = /\brel="([^"]+)"/.exec(tag)?.[1];
    const href = /\bhref="([^"]+)"/.exec(tag)?.[1];
    if (href && (rel === "modulepreload" || rel === "stylesheet")) seeds.add(href);
  }
  for (const script of html.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? []) {
    for (const m of script.matchAll(/import\(\s*["']([^"']+\.js)["']\s*\)/g)) seeds.add(m[1]);
  }
  // Minified chunks write `import{a as b}from"./x.js"` and `import"./x.js"`; `import()` is lazy.
  const staticImport = /(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+\.(?:js|css))["']/g;
  const found = new Set();
  const queue = [...seeds].map((href) => toFile(href));
  while (queue.length) {
    const file = queue.pop();
    if (found.has(file) || !existsSync(file)) continue;
    found.add(file);
    if (!file.endsWith(".js")) continue;
    for (const m of readFileSync(file, "utf8").matchAll(staticImport)) {
      queue.push(toFile(m[1], file));
    }
  }
  return found;
}

function toFile(href, from) {
  return href.startsWith("/")
    ? join(buildDir, href)
    : resolve(from ? dirname(from) : buildDir, href);
}

// Chromium at 1440x900, until the network goes quiet: the demos LazyDemo starts for boxes
// already on screen count too, and a static walk misses them.
async function browserLoad() {
  const { chromium } = await import("@playwright/test");
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(buildDir, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
    if (!file.startsWith(buildDir) || !existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const found = new Set();
  const visit = async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("requestfinished", (req) => {
      const path = new URL(req.url()).pathname;
      if (req.url().startsWith(origin) && /\.(js|css)$/.test(path)) found.add(join(buildDir, path));
    });
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  };
  await visit().finally(async () => {
    await browser.close();
    server.close();
  });
  return found;
}
