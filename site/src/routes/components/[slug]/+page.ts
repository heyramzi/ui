import { error } from "@sveltejs/kit";
import { bySlug, entries as all } from "#lib/registry.js";

export const prerender = true;

export function entries() {
  return all.map((e) => ({ slug: e.slug }));
}

export function load({ params }) {
  const entry = bySlug(params.slug);
  if (!entry) error(404, "No such component");
  return { entry };
}
