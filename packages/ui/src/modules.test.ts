import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import * as record from "#src/record/index.js";
import * as inbox from "#src/inbox/index.js";
import * as thread from "#src/thread/index.js";
import * as triage from "#src/triage/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports: Record<string, string | Record<string, string>>;
};

const targetOf = (v: string | Record<string, string>) =>
  typeof v === "string" ? v : (v.svelte ?? v.default);

/** A relative or `#src` specifier as a `.ts` or `.svelte` file, or null for a package. */
function resolveSpec(from: string, spec: string): string | null {
  if (!spec.startsWith("#src/") && !spec.startsWith(".")) return null;
  const p = spec.startsWith("#src/") ? join(root, "src", spec.slice(5)) : join(dirname(from), spec);
  const hit = [p, p.replace(/\.js$/, ".ts"), `${p}.ts`, join(p, "index.ts")].find(
    (c) => /\.(ts|svelte)$/.test(c) && existsSync(c),
  );
  return hit ?? null;
}

type Origin = { file: string; name: string };
const origins = new Map<string, Map<string, Origin>>();

/** Each name a module exports, traced through re-exports to the file and name that define it. */
function exportsOf(file: string): Map<string, Origin> {
  const known = origins.get(file);
  if (known) return known;
  const out = new Map<string, Origin>();
  origins.set(file, out);
  if (file.endsWith(".svelte")) return out.set("default", { file, name: "default" });

  const code = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const trace = (src: string | null, name: string): Origin =>
    (src && exportsOf(src).get(name)) || { file: src ?? file, name };
  const specifiers = (list: string) =>
    list
      .split(",")
      .map((part) => part.trim().replace(/^type\s+/, ""))
      .filter(Boolean)
      .map((part) => part.split(/\s+as\s+/));

  const imported = new Map<string, Origin>();
  for (const [, def, list = "", spec] of code.matchAll(
    /import\s+(?:type\s+)?([\w$]+)?\s*,?\s*(?:\{([^}]*)\})?\s*from\s*["']([^"']+)["']/g,
  )) {
    const src = resolveSpec(file, spec);
    if (def) imported.set(def, trace(src, "default"));
    for (const [name, local = name] of specifiers(list)) imported.set(local, trace(src, name));
  }
  for (const [, list, spec] of code.matchAll(
    /export\s+(?:type\s+)?\{([^}]*)\}(?:\s*from\s*["']([^"']+)["'])?/g,
  )) {
    const src = spec ? resolveSpec(file, spec) : null;
    for (const [name, as = name] of specifiers(list))
      out.set(as, spec ? trace(src, name) : (imported.get(name) ?? { file, name }));
  }
  for (const [, spec] of code.matchAll(/export\s+\*\s+from\s*["']([^"']+)["']/g)) {
    const src = resolveSpec(file, spec);
    if (src) for (const [name, at] of exportsOf(src)) if (name !== "default") out.set(name, at);
  }
  for (const [, name] of code.matchAll(
    /export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|function\*?|class|type|interface|enum)\s+([\w$]+)/g,
  ))
    out.set(name, { file, name });
  return out;
}

/** Every public module path and its file, wildcards expanded. The `./canvas/*` deep paths stay beside the barrel in 3.0. */
function publicModules(): Map<string, string> {
  const modules = new Map<string, string>();
  for (const [key, value] of Object.entries(pkg.exports)) {
    const target = targetOf(value);
    if (!/\.(ts|svelte)$/.test(target) || key.startsWith("./canvas/")) continue;
    if (!key.includes("*")) {
      modules.set(key, join(root, target));
      continue;
    }
    const [head, tail] = target.split("*");
    for (const entry of readdirSync(join(root, head), { withFileTypes: true })) {
      const { name } = entry;
      const stem = entry.isDirectory() ? name : name.endsWith(tail) && name.slice(0, -tail.length);
      if (!stem) continue;
      const file = join(root, head + stem + tail);
      if (existsSync(file) && !file.endsWith(".test.ts")) modules.set(key.replace("*", stem), file);
    }
  }
  return modules;
}

describe("module split", () => {
  it("holds the record page's names", () => {
    expect(record.RecordShell).toBeDefined();
    expect(record.DEFAULT_RECORD_LABELS).toBeDefined();
  });

  it("names what the new modules export", () => {
    expect(thread.Thread).toBeDefined();
    expect(inbox.ThreadInbox).toBeDefined();
    expect(inbox.InboxCard).toBeDefined();
    expect(inbox.threadsOf).toBeTypeOf("function");
    expect(triage.TriagePlan).toBeDefined();
    expect(triage.TriageTask).toBeDefined();
    expect(triage.TriageQueue).toBeDefined();
  });

  it("resolves every export path to a file", () => {
    const missing: string[] = [];
    for (const [name, target] of Object.entries(pkg.exports)) {
      const path = targetOf(target);
      if (path.includes("*") || path.endsWith(".css")) continue;
      if (!existsSync(join(root, path))) missing.push(`${name} -> ${path}`);
    }
    expect(missing).toEqual([]);
  });

  it("exports each module once, under its own name", () => {
    for (const name of [
      "./work",
      "./status",
      "./panel",
      "./record",
      "./thread",
      "./inbox",
      "./triage",
    ]) {
      expect(pkg.exports[name], name).toBeDefined();
    }
    expect(Object.keys(pkg.exports).filter((name) => name.startsWith("./tasks"))).toEqual([]);
  });

  it("ships no demo, the docs site holds them", () => {
    expect(Object.keys(pkg.exports).filter((name) => name.includes("demo"))).toEqual([]);
  });

  it("has no package root, every import names its subpath", () => {
    expect(pkg.exports["."]).toBeUndefined();
    expect(existsSync(join(root, "src/index.ts"))).toBe(false);
  });

  it("reaches each value and type through one public path", () => {
    const paths = new Map<string, string[]>();
    for (const [key, file] of publicModules())
      for (const [name, at] of exportsOf(file)) {
        const id = `${relative(join(root, "src"), at.file)}#${at.name}`;
        paths.set(id, [...(paths.get(id) ?? []), `${key} :: ${name}`]);
      }
    const twice = [...paths]
      .filter(([, at]) => new Set(at.map((a) => a.split(" :: ")[0])).size > 1)
      .map(([id, at]) => `${id} <- ${at.join(", ")}`);
    expect(twice).toEqual([]);
  });

  it("traces a re-export to its source and expands wildcards, so a clean run means something", () => {
    const twice = [...exportsOf(join(root, "src/components/list-page/index.ts"))].filter(([, at]) =>
      at.file.endsWith("lib/panel.svelte"),
    );
    expect(twice.map(([name]) => name)).toEqual(["DetailPanel"]);
    expect(publicModules().get("./lib/tone.js")).toBe(join(root, "src/lib/tone.ts"));
  });
});
