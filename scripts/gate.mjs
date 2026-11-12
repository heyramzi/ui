#!/usr/bin/env node
// check-changed over the changed files and every file importing them; usage in CODING_STANDARDS.md, Repository conventions.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

const git = (...a) =>
  execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }).trim();
const lines = (s) => s.split("\n").filter(Boolean);
const ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const KIT = join(homedir(), "Studio/upsys/kit");
const CHECK_CHANGED = join(KIT, "scripts/check-changed.mjs");
const HEAVY_GATE = join(KIT, "scripts/mac/heavy-gate.py");
const CODE = /\.(svelte|ts|js|mjs|cjs)$/;
// No import graph reaches the users of a lockfile, tsconfig, svelte.config.js or .d.ts, so their package gets its whole check.
const WHOLE = /(^|\/)(tsconfig\.json|svelte\.config\.js|[^/]+\.d\.ts)$|^pnpm-lock\.yaml$/;

const args = process.argv.slice(2);
const named = args.filter((a) => !a.startsWith("--"));
const passed = args.filter((a) => ["--e2e", "--warnings", "--force"].includes(a));
const pushing = !named.length && process.env.PUSH_FILES !== undefined;

/** The paths named, else the push's PUSH_FILES, else --staged, else everything since origin/main. */
function changed() {
  if (named.length) return named.map((f) => relative(ROOT, resolve(f)));
  if (pushing) return lines(process.env.PUSH_FILES);
  if (args.includes("--staged"))
    return lines(git("diff", "--cached", "--name-only", "--diff-filter=ACMR"));
  const mergeBase = spawnSync("git", ["merge-base", "HEAD", "origin/main"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const base = mergeBase.status === 0 ? mergeBase.stdout.trim() : "HEAD";
  const tracked = lines(git("diff", "--name-only", "--diff-filter=ACMR", base));
  return [...new Set([...tracked, ...lines(git("ls-files", "--others", "--exclude-standard"))])];
}

// The workspaces pnpm-workspace.yaml lists: site and packages/*.
const PACKAGES = ["site", ...readdirSync(join(ROOT, "packages")).map((d) => `packages/${d}`)]
  .filter((dir) => existsSync(join(ROOT, dir, "package.json")))
  .map((dir) =>
    Object.assign(JSON.parse(readFileSync(join(ROOT, dir, "package.json"), "utf8")), { dir }),
  );
const ownerOf = (file) => PACKAGES.find((p) => file.startsWith(`${p.dir}/`));

/** `#src/*.js`, `./shadcn/button` and the like: a package.json `imports` or `exports` entry, wildcard or exact. */
function mapped(dir, map = {}, key) {
  for (const [from, to] of Object.entries(map)) {
    const target = typeof to === "string" ? to : (to?.default ?? to?.import);
    if (typeof target !== "string") continue;
    if (from === key) return join(dir, target);
    const star = from.indexOf("*");
    if (star < 0) continue;
    const [head, tail] = [from.slice(0, star), from.slice(star + 1)];
    if (key.length < from.length - 1 || !key.startsWith(head) || !key.endsWith(tail)) continue;
    return join(dir, target.replace("*", key.slice(head.length, key.length - tail.length)));
  }
  return null;
}

const SOURCES = new Set(
  lines(
    git(
      "ls-files",
      "-co",
      "--exclude-standard",
      "--",
      "site/src/*",
      "site/scripts/*",
      "packages/*/src/*",
      "packages/*/scripts/*",
    ),
  ).filter((f) => CODE.test(f)),
);
const EXTS = ["", ".ts", ".js", ".svelte", ".svelte.ts", ".mjs", "/index.ts", "/index.js"];

function resolveSpec(from, spec) {
  const pkg = ownerOf(from);
  let base = null;
  if (spec.startsWith(".")) base = join(dirname(from), spec);
  else if (spec === "$lib" || spec.startsWith("$lib/"))
    base = pkg && join(pkg.dir, "src/lib", spec.slice(4));
  else if (spec.startsWith("#")) base = pkg && mapped(pkg.dir, pkg.imports, spec);
  else {
    const dep = PACKAGES.find((p) => spec === p.name || spec.startsWith(`${p.name}/`));
    base = dep && mapped(dep.dir, dep.exports, `.${spec.slice(dep.name.length)}`);
  }
  if (!base) return null;
  for (const b of [base, base.replace(/\.js$/, "")])
    for (const ext of EXTS) if (SOURCES.has(b + ext)) return b + ext;
  return null;
}

const IMPORT =
  /\b(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']/g;
const REEXPORT =
  /^\s*export\s+(?:type\s+)?(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+["']([^"']+)["']/gm;

const add = (map, key, f) => map.set(key, (map.get(key) ?? new Set()).add(f));

/** Every source that imports a changed file; a barrel that re-exports it passes the search on to its own importers. */
function withImporters(files) {
  const importers = new Map();
  const reexporters = new Map();
  for (const f of SOURCES) {
    if (!existsSync(join(ROOT, f))) continue;
    const text = readFileSync(join(ROOT, f), "utf8");
    for (const m of text.matchAll(IMPORT)) {
      const to = resolveSpec(f, m[1] ?? m[2]);
      if (to && to !== f) add(importers, to, f);
    }
    for (const m of text.matchAll(REEXPORT)) {
      const to = resolveSpec(f, m[1]);
      if (to) add(reexporters, to, f);
    }
  }
  const seen = new Set(files);
  let frontier = files.filter((f) => SOURCES.has(f));
  while (frontier.length) {
    const next = [];
    for (const f of frontier)
      for (const imp of importers.get(f) ?? []) {
        if (seen.has(imp)) continue;
        seen.add(imp);
        if (reexporters.get(f)?.has(imp)) next.push(imp);
      }
    frontier = next;
  }
  return [...seen];
}

function run(cmd, cmdArgs, env) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, ...env },
  });
  return r.status === 0;
}

const files = changed().filter((f) => existsSync(join(ROOT, f)));
if (!files.length) {
  console.log("gate: nothing changed");
  process.exit(0);
}
const code = files.filter((f) => CODE.test(f));
const all = withImporters(files);
console.log(
  `gate: ${files.length} changed file(s), ${code.length} of them code, ${all.length - files.length} importer(s) added`,
);
if (args.includes("--list")) {
  console.log(all.join("\n"));
  process.exit(0);
}

let ok = true;
// The push hook formats and length-checks the pushed files in its own managed blocks.
if (!pushing) {
  ok =
    run(join(ROOT, "node_modules/.bin/vp"), [
      "fmt",
      "--check",
      "--no-error-on-unmatched-pattern",
      ...files,
    ]) && ok;
  const lengths = join(ROOT, "node_modules/@heyramzi/lint/bin/heyramzi-comment-length.js");
  ok = run("node", [lengths], { PUSH_FILES: files.join("\n") }) && ok;
}

if (!existsSync(CHECK_CHANGED)) {
  console.error(`gate: ${CHECK_CHANGED} is missing, so nothing was typechecked or tested`);
  process.exit(1);
}
ok = run("node", [CHECK_CHANGED, ...passed, ...all.map((f) => join(ROOT, f))]) && ok;

const whole = new Set();
for (const f of files.filter((file) => WHOLE.test(file))) {
  const owner = ownerOf(f);
  for (const p of owner ? [owner] : PACKAGES) if (p.scripts?.check) whole.add(p.name);
}
for (const name of whole) {
  console.log(`\ngate: ${name}'s config or shared types changed, so its whole check runs`);
  const check = ["pnpm", "--filter", name, "run", "check"];
  const gated = existsSync(HEAVY_GATE)
    ? ["python3", [HEAVY_GATE, "run", "--", ...check]]
    : [check[0], check.slice(1)];
  ok = run(gated[0], gated[1], { FULL_CHECK: "1" }) && ok;
}

console.log(ok ? "\ngate: pass" : "\ngate: FAIL");
process.exit(ok ? 0 : 1);
