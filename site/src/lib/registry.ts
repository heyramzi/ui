import type { Component } from "svelte";
import { componentSources } from "#lib/component-sources.js";
import { cardOf, cards, type Card } from "#lib/nav.js";

/** A demo with its component and source loaded, for the page that renders it. */
export type Entry = Card & {
  component: Component;
  source: string;
  /** Repo-relative paths of the component source file(s) behind this demo, for "Copy". */
  sourceFiles: string[];
};

// Lazy: each demo and its text is its own chunk, fetched by the one page that shows it.
const components = import.meta.glob<{ default: Component }>([
  "./demos/*.svelte",
  "./shadcn-demos/*.svelte",
]);
const sources = import.meta.glob<string>(["./demos/*.svelte", "./shadcn-demos/*.svelte"], {
  query: "?raw",
  import: "default",
});

// The demo files and the cards in `nav.ts` stay one list: a card with no file, or a written
// demo with no card, fails the build here.
for (const card of cards) {
  if (!components[card.demo]) throw new Error(`registry: "${card.slug}" has no ${card.demo}`);
}
const carded = new Set(cards.map((c) => c.demo));
for (const path of Object.keys(components)) {
  if (path.startsWith("./demos/") && !carded.has(path))
    throw new Error(`registry: ${path} has no entry in registry-meta.ts`);
}

/** One demo, its component and its source, by slug. */
export async function loadEntry(slug: string): Promise<Entry> {
  const card = cardOf(slug);
  const [mod, source] = await Promise.all([components[card.demo](), sources[card.demo]()]);
  return {
    ...card,
    component: mod.default,
    source: source.trim(),
    sourceFiles: componentSources[slug] ?? [],
  };
}

/**
 * The path under a page's title: the import named after the part, else the demo's first. A demo
 * often leads with a helper, which put Button's path on the Card page. A synced primitive's path
 * is its folder even when the demo never imports it: Sonner's demo only calls `toast`.
 */
export const importOf = (entry: Entry) => {
  const paths = [...entry.source.matchAll(/from "(@heyramzi\/[^"]+)"/g)].map((m) => m[1]);
  const own = paths.find((path) => path.endsWith(`/${entry.slug}`));
  if (own) return own;
  return entry.demo.startsWith("./shadcn-demos/") ? `@heyramzi/ui/shadcn/${entry.slug}` : paths[0];
};

/** The demo's import of the part's own path, for the Usage block. Helpers the demo leans on stay out. */
export const importLinesOf = (entry: Entry) => {
  const path = importOf(entry);
  const statements = [...entry.source.matchAll(/import\s[^"]*?from\s+"(@heyramzi\/[^"]+)";?/g)];
  const own = statements.find((m) => m[1] === path)?.[0];
  return (own ?? "").replace(/\n[\t ]+/g, "\n  ").replace(/\n {2}\}/g, "\n}");
};
