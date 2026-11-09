import { error } from "@sveltejs/kit";
import { componentMarkdown, textFile } from "#lib/llms.js";
import { cardBySlug, cards } from "#lib/nav.js";
import { loadEntry } from "#lib/registry.js";

export const prerender = true;

export function entries() {
  return cards.map((c) => ({ slug: c.slug }));
}

export async function GET({ params }) {
  if (!cardBySlug(params.slug)) error(404, "No such component");
  return textFile(componentMarkdown(await loadEntry(params.slug)), "text/markdown");
}
