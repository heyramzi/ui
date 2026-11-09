import { error } from "@sveltejs/kit";
import { componentMarkdown, textFile } from "#lib/llms.js";
import { bySlug, entries as all } from "#lib/registry.js";

export const prerender = true;

export function entries() {
  return all.map((e) => ({ slug: e.slug }));
}

export function GET({ params }) {
  const entry = bySlug(params.slug);
  if (!entry) error(404, "No such component");
  return textFile(componentMarkdown(entry), "text/markdown");
}
