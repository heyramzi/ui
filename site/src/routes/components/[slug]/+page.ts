import { error } from "@sveltejs/kit";
import { bySlug, entries as all } from "#lib/registry.js";

export const prerender = true;

export function entries() {
  return all.map((e) => ({ slug: e.slug }));
}

export function load({ params }) {
  if (!bySlug(params.slug)) error(404, "No such component");
  return {};
}
