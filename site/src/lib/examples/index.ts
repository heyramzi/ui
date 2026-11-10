import type { Component } from "svelte";

/** One named example: the list in `<slug>/index.ts` sets the order, the file holds the demo. */
export type Example = { name: string; title: string; note: string };

/** An example with its component and source loaded, for the page that renders it. */
export type LoadedExample = Example & { component: Component; source: string };

const lists = import.meta.glob<Example[]>("./*/index.ts", { eager: true, import: "default" });

// Lazy: each example and its text is its own chunk, fetched by the one page that shows it.
const components = import.meta.glob<{ default: Component }>("./*/*.svelte");
const sources = import.meta.glob<string>("./*/*.svelte", { query: "?raw", import: "default" });

const slugOf = (path: string) => path.split("/")[1];

// The files and the lists stay one set: a row with no file, or a file with no row, fails the build.
const listed = new Set<string>();
for (const [path, list] of Object.entries(lists)) {
  for (const example of list) {
    const file = `./${slugOf(path)}/${example.name}.svelte`;
    if (!components[file]) throw new Error(`examples: ${path} lists ${file}, which doesn't exist`);
    listed.add(file);
  }
}
for (const file of Object.keys(components)) {
  if (!listed.has(file)) throw new Error(`examples: ${file} has no row in its index.ts`);
}

/** A page's examples in their listed order, or none. */
export async function loadExamples(slug: string): Promise<LoadedExample[]> {
  const list = lists[`./${slug}/index.ts`] ?? [];
  return Promise.all(
    list.map(async (example) => {
      const file = `./${slug}/${example.name}.svelte`;
      const [mod, source] = await Promise.all([components[file](), sources[file]()]);
      return { ...example, component: mod.default, source: source.trim() };
    }),
  );
}
