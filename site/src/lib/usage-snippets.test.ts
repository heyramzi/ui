import { describe, expect, it } from "vite-plus/test";
import { cardBySlug } from "#lib/nav.js";
import { importLinesOf, importOf } from "#lib/registry.js";
import { usageSnippets } from "#lib/usage-snippets.js";

const sources = import.meta.glob<string>(["./demos/*.svelte", "./shadcn-demos/*.svelte"], {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The page's import line and path, read from its demo the way the page reads them. */
function pageImport(slug: string) {
  const card = cardBySlug(slug);
  if (!card) return null;
  const text = { slug, demo: card.demo, source: sources[card.demo].trim() };
  return { line: importLinesOf(text), path: importOf(text) };
}

/** Each local name the import line binds, to the export it reads: `*` for a namespace. */
function bindings(line: string): Map<string, string> {
  const clause = line.replace(/^import\s+/, "").replace(/\s*from\s+"[^"]+";?\s*$/, "");
  const bound = new Map<string, string>();
  const namespace = clause.match(/^\*\s+as\s+(\w+)/);
  if (namespace) return bound.set(namespace[1], "*");
  const fallback = clause.match(/^(\w+)/);
  if (fallback) bound.set(fallback[1], "default");
  const named = clause.match(/\{([^}]*)\}/)?.[1] ?? "";
  for (const part of named.split(",").map((p) => p.trim())) {
    if (!part || part.startsWith("type ")) continue;
    const [exported, local = exported] = part.split(/\s+as\s+/);
    bound.set(local, exported);
  }
  return bound;
}

/** Every component tag the snippet names that the page's import doesn't export. */
async function strangers(slug: string, snippet: string): Promise<string[]> {
  const page = pageImport(slug);
  if (!page?.line || !page.path) return [`${slug}: no import line to show the snippet under`];
  const bound = bindings(page.line);
  const exports = await import(/* @vite-ignore */ page.path);
  const missing: string[] = [];
  for (const [, local, member] of snippet.matchAll(/<([A-Z]\w*)((?:\.\w+)*)/g)) {
    const binding = bound.get(local);
    const name = binding === "*" ? member.split(".")[1] : binding;
    if (!name || !(name in exports)) missing.push(`<${local}${member}>`);
  }
  return missing;
}

describe("usage snippets", () => {
  it("key real component pages", () => {
    const unknown = Object.keys(usageSnippets).filter((slug) => !cardBySlug(slug));
    expect(unknown).toEqual([]);
  });

  it.each(Object.entries(usageSnippets))(
    "%s names only parts its import exports",
    async (slug, snippet) => {
      expect(await strangers(slug, snippet)).toEqual([]);
    },
    // WHY: code-block's cold import pulls in shiki: 19 s alone, past 30 s while heavy-gate runs other jobs (10 Nov 2026).
    90_000,
  );

  it("fails a part the import doesn't export", async () => {
    expect(await strangers("dialog", "<Dialog.Root><Dialog.Drawer /></Dialog.Root>")).toEqual([
      "<Dialog.Drawer>",
    ]);
    expect(await strangers("tabs", "<Tabs><Button /></Tabs>")).toEqual(["<Button>"]);
  });
});
