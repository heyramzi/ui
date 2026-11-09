import { error } from "@sveltejs/kit";
import { sectionById, sections } from "#lib/nav.js";
import { loadEntry } from "#lib/registry.js";

export function entries() {
  return sections.map((s) => ({ section: s.id }));
}

/** The section and only its own demos, each on its own chunk. */
export async function load({ params }) {
  const section = sectionById(params.section);
  if (!section) error(404, "No such section");
  const slugs = section.categories.flatMap((c) =>
    c.items.filter((item): item is string => typeof item === "string"),
  );
  const loaded = await Promise.all(slugs.map(loadEntry));
  return { section, demos: Object.fromEntries(loaded.map((e) => [e.slug, e])) };
}
