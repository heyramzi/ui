/* Shared plumbing for the two upstream sync scripts. `.upstream/` holds the
 * pristine copy each one diffs against. See ../../docs/decisions.md. */

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const CHECK = process.argv.includes("--check");

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

const get = (url) => fetch(url, { headers: { "user-agent": "heyramzi-ui-sync" } });

export async function fetchText(url) {
  const res = await get(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return await res.text();
}

/** null instead of a throw, for an upstream file that may not exist. */
export async function fetchTextIf(url) {
  const res = await get(url);
  return res.ok ? await res.text() : null;
}

export async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

/** Resolve the upstream commit a sync pinned, so the lock names a point in history. */
export async function githubHeadSha(repo, branch = "main") {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits/${branch}`, {
    headers: { accept: "application/vnd.github.sha", "user-agent": "heyramzi-ui-sync" },
  });
  return res.ok ? (await res.text()).trim() : null;
}

/* Formatting is not divergence: oxfmt reflows prettier wraps and adds
 * its missing trailing comma, so norm strips both before comparing. */
const norm = (text) =>
  text
    .replace(/,(\s*[)\]}>])/g, "$1")
    .replace(/\s+(\/?>)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Where our copy stands against `base`, the content the last sync vendored, and
 * `next`, what upstream ships now. Both already adapted to this package.
 */
export function classify(local, base, next) {
  if (local === null) return base === null ? "new" : "dropped";
  if (norm(local) === norm(next)) return "current";
  if (base !== null && norm(local) === norm(base)) return "stale";
  return "diverged";
}

export async function readLock(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

export async function writeFileDeep(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function removeDeep(path) {
  await rm(path, { recursive: true, force: true });
}

/** Run `fn` over `items` with at most `limit` in flight. */
export async function mapLimit(items, limit, fn) {
  const out = Array.from({ length: items.length });
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const BULLET = { added: "+", changed: "~", removed: "-", unported: "!", synced: "*", port: "!" };

/** Print the buckets and exit non-zero under --check when any is non-empty. */
export function report({ title, buckets, unchanged, footer, trailer }) {
  const lines = [];
  for (const [kind, items] of Object.entries(buckets)) {
    for (const item of items) lines.push(`  ${BULLET[kind] ?? "?"} ${kind.padEnd(9)} ${item}`);
  }
  console.log(`\n${title}`);
  console.log(lines.length ? lines.join("\n") : "  = in sync");
  console.log(`  ${unchanged} unchanged${footer ? `, ${footer}` : ""}`);

  if (!lines.length) return 0;
  if (CHECK) {
    console.error("\n  --check: upstream moved. Run the sync without --check and port the diff.");
    return 1;
  }
  console.log(
    `\n  ${trailer ?? "Vendored copies updated. Review `git diff .upstream/` and port by hand."}`,
  );
  return 0;
}
