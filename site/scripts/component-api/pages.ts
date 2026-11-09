import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { componentSources } from "../../src/lib/component-sources.ts";
import { meta } from "../../src/lib/registry-meta.ts";
import { partOf } from "./props.ts";
import { keyName, read, resolveImport, ROOT, scopeOf, SITE, UI_SRC } from "./source.ts";
import { list, type Part } from "./types.ts";

// ========================= PAGES

export const pascal = (s: string) =>
  s
    .replace(/\.svelte$/, "")
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

/** What a folder's index.ts exports each component file as, in export order. */
export function exportsOf(dir: string): Map<string, string[]> {
  const index = join(dir, "index.ts");
  const names = new Map<string, string[]>();
  if (!existsSync(index)) return names;
  const rec = read(index);
  const add = (file: string | null, name: string) => {
    if (!file?.endsWith(".svelte")) return;
    names.set(file, [...(names.get(file) ?? []), name]);
  };
  for (const stmt of rec.programs.flatMap((p) => list(p.body))) {
    if (stmt.type !== "ExportNamedDeclaration") continue;
    for (const s of stmt.specifiers ?? []) {
      if (s.exportKind === "type") continue;
      const local = keyName(s.local);
      const exported = keyName(s.exported);
      if (stmt.source) {
        if (local === "default") add(resolveImport(index, String(stmt.source.value)), exported);
        continue;
      }
      const binding = scopeOf(rec).get(local);
      if (binding?.kind === "import" && binding.imported === "default") {
        add(resolveImport(index, binding.source), exported);
      }
    }
  }
  return names;
}

/** The component files a page documents: its listed sources, plus the rest of the folder named
 *  after the slug, since a primitive's parts (Dialog.Trigger) are all one page. */
export function filesOf(slug: string): string[] {
  const listed = (componentSources[slug] ?? []).map((p) => join(ROOT, p));
  const dirs = new Set(listed.map((p) => dirname(p)).filter((d) => basename(d) === slug));
  for (const group of ["shadcn", "components"]) {
    const dir = join(UI_SRC, group, slug);
    if (!listed.length && existsSync(dir)) dirs.add(dir);
  }
  const files = listed.filter((f) => f.endsWith(".svelte"));
  for (const dir of [...dirs].sort()) {
    const exported = [...exportsOf(dir).keys()];
    const own = exported.length
      ? exported
      : readdirSync(dir)
          .filter((f) => f.endsWith(".svelte"))
          .sort()
          .map((f) => join(dir, f));
    for (const f of own) if (!files.includes(f)) files.push(f);
  }
  return files;
}

/** The name a part goes by in code: `Dialog.Trigger` for a namespaced primitive, else its
 *  export. `tags` are every spelling the demo might use, for ordering. */
export function namesOf(files: string[]): { label: string; tags: string[] }[] {
  return files.map((file) => {
    const dirExports = exportsOf(dirname(file));
    const exported = dirExports.get(file) ?? [];
    const rootNames = [...dirExports.values()].find((n) => n.includes("Root"));
    const ns = rootNames?.find((n) => n !== "Root");
    if (ns && exported.length) {
      const short = exported.find((n) => !n.startsWith(ns) || n === ns) ?? exported[0];
      const siblings = files.filter((f) => dirname(f) === dirname(file)).length;
      return { label: siblings > 1 ? `${ns}.${short}` : ns, tags: [`${ns}.${short}`, ...exported] };
    }
    const label = exported[0] ?? pascal(basename(file));
    return { label, tags: [label] };
  });
}

/** Parts in the order the page's demo first uses them, unused ones after, main file first. */
export function ordered<T extends { tags: string[] }>(slug: string, parts: T[]): T[] {
  const demo = [
    join(SITE, "src/lib/demos", `${slug}.svelte`),
    join(SITE, "src/lib/shadcn-demos", `${slug}.svelte`),
  ]
    .filter((f) => existsSync(f))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  const firstUse = (part: T) => {
    const hits = part.tags
      .map((tag) => demo.search(new RegExp(`<${tag.replace(".", "\\.")}[\\s/>]`)))
      .filter((i) => i >= 0);
    return hits.length ? Math.min(...hits) : Infinity;
  };
  const [main, ...rest] = parts;
  const ranked = rest
    .map((part, i) => ({ part, i, at: firstUse(part) }))
    .sort((a, b) => a.at - b.at || a.i - b.i)
    .map((r) => r.part);
  return main ? [main, ...ranked] : [];
}

export function build(): Record<string, Part[]> {
  const demoSlugs = readdirSync(join(SITE, "src/lib/shadcn-demos"))
    .filter((f) => f.endsWith(".svelte"))
    .map((f) => f.replace(/\.svelte$/, ""));
  const slugs = [...new Set([...Object.keys(meta), ...demoSlugs])].sort();
  const out: Record<string, Part[]> = {};
  for (const slug of slugs) {
    const files = filesOf(slug);
    if (!files.length) continue;
    const names = namesOf(files);
    const parts = files.map((file, i) => ({
      name: names[i].label,
      tags: names[i].tags,
      file: relative(ROOT, file),
      ...partOf(file),
    }));
    out[slug] = ordered(slug, parts).map(({ tags: _tags, ...part }) => part);
  }
  return out;
}
