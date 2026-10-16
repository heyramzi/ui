#!/usr/bin/env node
/* Sync shadcn-svelte into src/shadcn and its demos into the showcase, three-way
 * per file against `.upstream/`. The rules and why: ../docs/decisions.md. */

//   pnpm sync:shadcn          fetch, vendor, apply, report
//   pnpm sync:shadcn --check  fail if upstream moved (CI / pre-release)

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, resolve } from "node:path";
import {
  CHECK,
  classify,
  fetchJson,
  fetchTextIf,
  mapLimit,
  readLock,
  removeDeep,
  report,
  sha256,
  writeFileDeep,
} from "#scripts/lib/sync-core.mjs";

/* The vega style's registry. The bare /registry lacks the chat parts (bubble,
 * message, marker, attachment); same item and file shape otherwise. */
const REGISTRY = "https://shadcn-svelte.com/registry/styles/vega";
const WANTED = new Set(["registry:ui", "registry:hook", "registry:lib"]);

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(PKG, "../..");
const VENDOR = `${PKG}/.upstream/shadcn`;
const LOCK = `${PKG}/.upstream/shadcn.lock.json`;
const LOCAL = `${PKG}/src/shadcn`;

/** Ours by choice, not upstream's: don't report them as drift. */
const LOCAL_ONLY = new Set(["hooks"]);

/* The registry's aliases, resolved to what this package imports. Absolute
 * `#src/` form, so a nested target resolves without counting `../`. */
const ALIASES = [
  ["$UTILS$.js", "@heyramzi/utils"],
  ["$UI$/", "#src/shadcn/"],
  ["$HOOKS$/", "#src/shadcn/hooks/"],
];

/* Upstream target path -> ours, where the two differ. Everything else lands at
 * src/shadcn/<target>. */
const REROUTE = {
  "is-mobile/is-mobile.svelte.ts": "src/shadcn/hooks/is-mobile.svelte.ts",
};

const DOCS = "https://raw.githubusercontent.com/huntabyte/shadcn-svelte/main/docs";
const DEMO_VENDOR = `${PKG}/.upstream/shadcn-demos`;
const DEMO_LOCAL = `${PKG}/src/showcase/demos/shadcn`;
const DEMO_MANIFEST = `${DEMO_LOCAL}/index.ts`;

/* The docs site's aliases. A demo is a docs file, not a registry payload, so it
 * carries `$lib/...` rather than the registry's `$UI$`. */
const DEMO_ALIASES = [
  ["$lib/registry/ui/", "#src/shadcn/"],
  // A handful reach their neighbour by relative path instead of the alias.
  ["../ui/", "#src/shadcn/"],
  ["$lib/registry/hooks/", "#src/shadcn/hooks/"],
  ["$lib/utils.js", "@heyramzi/utils"],
  // The peer here is the runes build, published under its own name.
  ["@tabler/icons-svelte/", "@tabler/icons-svelte-runes/"],
];

/* Registry primitives this package does not ship: no product imports them. Skipped, so a sync does not bring them back. */
const NOT_SHIPPED = new Set([
  "aspect-ratio",
  "button-group",
  "carousel",
  "chart",
  "data-table",
  "drawer",
  "form",
  "input-group",
  "item",
  "kbd",
  "menubar",
  "native-select",
  "navigation-menu",
  "pagination",
  "range-calendar",
  "resizable",
  // Its `pascalToKebab` has no importer, in the registry or here.
  "casing",
  // `cn` ships from @heyramzi/utils in vibe-kit, so a copy here would be a stray.
  "utils",
  "questionnaire",
  // Every app chat runs on our ai/conversation, so a second scroller would be two answers to one job.
  "message-scroller",
]);

/* No demo to take: `hooks`, `is-mobile` and `utils` are not components, and `sidebar` demos as a page block. */
const NO_DEMO = new Set(["hooks", "is-mobile", "sidebar", "utils"]);

const adapt = (text) => ALIASES.reduce((acc, [from, to]) => acc.replaceAll(from, to), text);
const adaptDemo = (text) =>
  DEMO_ALIASES.reduce((acc, [from, to]) => acc.replaceAll(from, to), text);
const readIf = (path) => (existsSync(path) ? readFileSync(path, "utf8") : null);
const route = (name, target) => `${PKG}/${REROUTE[`${name}/${target}`] ?? `src/shadcn/${target}`}`;
/** Report a file by where it lives here, not by its upstream target. */
const label = (path) => path.slice(PKG.length + 1);

const pascal = (name) => name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

/** Title and one-line description from the component's docs page. */
const meta = (doc, name) => {
  const head = doc?.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const field = (key) =>
    head
      .match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]
      .trim()
      .replace(/^["']|["']$/g, "");
  return { title: field("title") ?? pascal(name), note: field("description") ?? "" };
};

/** The demo's own shadcn imports, respelled as a consumer writes them. */
const publicImports = (demo) =>
  [...demo.matchAll(/import[^;]*?from\s+"#src\/shadcn\/([^"]+?)(?:\/index\.js)?";/g)]
    .map((m) => m[0].replace(/"[^"]+"/, `"@heyramzi/ui/shadcn/${m[1]}"`))
    .join("\n");

/* The section's list, generated: a primitive reaches the page by being synced,
 * never by being typed into an array. */
async function writeManifest(demos) {
  const rows = demos.map(
    (d) =>
      `  { name: ${JSON.stringify(d.name)}, title: ${JSON.stringify(d.title)}, note: ${JSON.stringify(d.note)}, path: ${JSON.stringify(d.imports)}, Comp: ${pascal(d.name)}Demo },`,
  );
  const text = [
    "/* Generated by scripts/sync-shadcn.mjs. Do not edit: the demos are upstream's",
    " * own, and the sync rewrites this list. */",
    'import type { Component } from "svelte";',
    ...demos.map(
      (d) => `import ${pascal(d.name)}Demo from "#src/showcase/demos/shadcn/${d.name}.svelte";`,
    ),
    "",
    "export type ShadcnDemo = {",
    "  name: string;",
    "  title: string;",
    "  note: string;",
    "  path: string;",
    "  Comp: Component;",
    "};",
    "",
    "export const SHADCN_DEMOS: ShadcnDemo[] = [",
    ...rows,
    "];",
    "",
  ].join("\n");
  if (readIf(DEMO_MANIFEST) === text) return;
  await writeFileDeep(DEMO_MANIFEST, text);
  written.push(DEMO_MANIFEST);
}

const walk = (dir, base = "") =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`, `${base}${e.name}/`) : [`${base}${e.name}`],
      )
    : [];

const index = await fetchJson(`${REGISTRY}/index.json`);
const items = (Array.isArray(index) ? index : (index.items ?? [])).filter(
  (i) => WANTED.has(i.type) && !NOT_SHIPPED.has(i.name),
);

const fetched = await mapLimit(items, 8, async (item) => ({
  item,
  payload: await fetchJson(`${REGISTRY}/${item.relativeUrl ?? `${item.name}.json`}`),
}));

const previous = (await readLock(LOCK))?.entries ?? {};
const entries = {};
const buckets = { synced: [], added: [], port: [], removed: [], unported: [] };
const written = [];
let unchanged = 0;

for (const { item, payload } of fetched) {
  const files = (payload.files ?? []).map((f) => ({
    target: f.target ?? f.path,
    content: f.content ?? "",
  }));
  // One hash per component, so the lock diff reads as a list of what moved.
  const hash = sha256(files.map((f) => `${f.target}:${f.content}`).join("|"));

  const states = files.map((f) => {
    const base = readIf(`${VENDOR}/${item.name}/${f.target}`);
    const next = adapt(f.content);
    const path = route(item.name, f.target);
    const state = classify(readIf(path), base === null ? null : adapt(base), next);
    return { ...f, path, next, state, moved: base !== f.content };
  });

  /* Upstream deleted these since the last sync. Ours goes only when it was
   * still the pristine copy of what upstream deleted. */
  const gone = walk(`${VENDOR}/${item.name}`)
    .filter((target) => !files.some((f) => f.target === target))
    .map((target) => {
      const path = route(item.name, target);
      const base = adapt(readIf(`${VENDOR}/${item.name}/${target}`));
      // Ours the moment it is not the pristine copy of what upstream deleted.
      return { target, path, ours: classify(readIf(path), base, base) === "diverged" };
    });

  const moved = states.filter((s) => s.moved);
  const fresh = !existsSync(`${LOCAL}/${item.name}`) && states.every((s) => s.state === "new");
  const blocked =
    states.some((s) => s.state === "dropped") ||
    moved.some((s) => s.state === "diverged") ||
    gone.some((g) => g.ours);
  const apply = blocked ? [] : moved.filter((s) => s.state !== "current");
  const drop = blocked ? [] : gone;

  const adapted = states.filter((s) => s.state === "diverged" || s.state === "dropped");
  entries[item.name] = {
    type: item.type,
    files: files.length,
    sha256: hash,
    ...(adapted.length ? { adapted: adapted.map((s) => s.target) } : {}),
  };

  if (!moved.length && !gone.length) unchanged++;
  else if (fresh) buckets.added.push(`${item.name} — ${files.length} files, new primitive`);
  else if (blocked)
    for (const s of moved) buckets.port.push(`${label(s.path)} — upstream moved, ${s.state} here`);
  else if (apply.length)
    buckets.synced.push(`${item.name} — ${apply.map((s) => basename(s.path)).join(", ")}`);

  for (const g of gone)
    buckets.removed.push(`${label(g.path)} — gone upstream${g.ours ? ", kept (ours)" : ""}`);

  if (CHECK) continue;

  for (const s of apply) {
    await writeFileDeep(s.path, s.next);
    written.push(s.path);
  }
  for (const g of drop) await removeDeep(g.path);

  await removeDeep(`${VENDOR}/${item.name}`);
  for (const f of files) await writeFileDeep(`${VENDOR}/${item.name}/${f.target}`, f.content);
}

for (const name of Object.keys(previous)) {
  if (entries[name]) continue;
  buckets.removed.push(`${name} — gone from the registry`);
  if (!CHECK) await removeDeep(`${VENDOR}/${name}`);
}

const ours = readdirSync(LOCAL, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !entries[e.name] && !LOCAL_ONLY.has(e.name))
  .map((e) => e.name);
for (const name of ours) buckets.unported.push(`${name} — in src/shadcn, not in the registry`);

/* The docs site's own demo for each primitive, vendored on the same three-way
 * rule. Upstream writes them; the showcase renders them. */
const demoNames = [...Object.keys(entries), ...LOCAL_ONLY]
  .filter((name) => !NO_DEMO.has(name))
  .toSorted();

const manifest = [];

for (const name of demoNames) {
  const [raw, doc] = await Promise.all([
    fetchTextIf(`${DOCS}/src/lib/registry/examples/${name}-demo.svelte`),
    fetchTextIf(`${DOCS}/content/components/${name}.md`),
  ]);
  if (raw === null) {
    buckets.unported.push(`${name} — no demo upstream`);
    continue;
  }

  const path = `${DEMO_LOCAL}/${name}.svelte`;
  const base = readIf(`${DEMO_VENDOR}/${name}.svelte`);
  const next = adaptDemo(raw);
  const local = readIf(path);
  const state = classify(local, base === null ? null : adaptDemo(base), next);
  // The imports of the demo that renders: ours when kept, upstream's when written.
  const shown = state === "diverged" ? local : next;

  if (state === "dropped") buckets.removed.push(`${label(path)} — dropped here, kept out`);
  else manifest.push({ name, ...meta(doc, name), imports: publicImports(shown) });

  if (base !== raw) {
    if (state === "diverged") buckets.port.push(`${label(path)} — upstream moved, ours here`);
    else if (state !== "current") buckets.synced.push(`${name} — demo`);
  }
  if (CHECK) continue;

  if (state === "stale" || state === "new") {
    await writeFileDeep(path, next);
    written.push(path);
  }
  await writeFileDeep(`${DEMO_VENDOR}/${name}.svelte`, raw);
}

if (!CHECK) await writeManifest(manifest);

/* Upstream ships prettier with tabs everywhere; .ts here is spaces. Root cwd,
 * because the fmt options live in the workspace vite.config.ts. */
if (written.length) {
  try {
    execFileSync("pnpm", ["exec", "vp", "fmt", ...written], { cwd: ROOT, stdio: "pipe" });
  } catch (error) {
    console.error(`\n  vp fmt failed, ${written.length} written files are unformatted`);
    console.error(`  ${error.message}`);
  }
}

if (!CHECK) {
  await writeFileDeep(
    LOCK,
    `${JSON.stringify(
      {
        source: "https://github.com/huntabyte/shadcn-svelte",
        registry: `${REGISTRY}/index.json`,
        fetchedAt: new Date().toISOString().slice(0, 10),
        components: items.length,
        localOnly: [...LOCAL_ONLY],
        entries,
      },
      null,
      "\t",
    )}\n`,
  );
}

process.exit(
  report({
    title: `shadcn-svelte — ${items.length} primitives`,
    buckets,
    unchanged,
    footer: `${Object.values(entries).filter((e) => e.adapted).length} adapted here, ${LOCAL_ONLY.size} ours`,
    trailer: `Wrote ${written.length} file${written.length === 1 ? "" : "s"}. Review \`git diff src/\`; the ! lines are yours to port.`,
  }),
);
