import { error } from "@sveltejs/kit";
import { cardBySlug, cards, sectionById } from "#lib/nav.js";
import { loadEntry } from "#lib/registry.js";
import { loadExamples } from "#lib/examples/index.js";

export const prerender = true;

export function entries() {
  return cards.map((c) => ({ slug: c.slug }));
}

/** The page's own demo and source, on their own chunk: nothing of the other demos loads. */
export async function load({ params, data }) {
  const card = cardBySlug(params.slug);
  if (!card) error(404, "No such component");
  const section = sectionById(card.section);
  if (!section) error(500, `No section "${card.section}"`);
  const [entry, examples] = await Promise.all([loadEntry(card.slug), loadExamples(card.slug)]);
  return { ...data, entry, examples, section };
}
