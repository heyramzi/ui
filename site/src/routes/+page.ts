import { homeSections } from "#lib/home/picks.js";
import { loadEntry } from "#lib/registry.js";

/** The 3 demos per section the home page shows, each on its own chunk. */
export async function load() {
  const slugs = homeSections.flatMap((s) => s.slugs);
  const loaded = await Promise.all(slugs.map(loadEntry));
  return { demos: Object.fromEntries(loaded.map((e) => [e.slug, e])) };
}
