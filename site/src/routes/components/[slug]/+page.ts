import { error } from "@sveltejs/kit";
import { bySlug, entries as all, sectionById } from "#lib/registry.js";

export const prerender = true;

export function entries() {
  return all.map((e) => ({ slug: e.slug }));
}

export function load({ params }) {
  const entry = bySlug(params.slug);
  if (!entry) error(404, "No such component");
  const section = sectionById(entry.section);
  if (!section) error(500, `No section "${entry.section}"`);
  return { entry, section };
}
