import { error } from "@sveltejs/kit";
import { sectionById, sections } from "#lib/registry.js";

export function entries() {
  return sections.map((s) => ({ section: s.id }));
}

export function load({ params }) {
  const section = sectionById(params.section);
  if (!section) error(404, "No such section");
  return { section };
}
