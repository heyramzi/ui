import { sections, type Section } from "#lib/nav.js";

/**
 * The 3 parts each home section leads with, picked by hand: a tile is 224px tall, so a part that
 * reads at a glance beats a whole screen scaled to a smudge. A section with no picks here falls
 * back to its first 3 demos.
 */
const picks: Record<string, string[]> = {
  foundations: ["theming", "colors", "icon"],
  components: ["calendar", "tabs", "hold-to-confirm"],
  effects: ["text-effect", "border-beam", "magic-card"],
  charts: ["area-chart", "donut-chart", "stat-card"],
  blocks: ["work-parts", "ai-prompt", "agent-cast"],
};

const slugsOf = (section: Section) =>
  section.categories.flatMap((c) => c.items.filter((i): i is string => typeof i === "string"));

/** Each section with its count and the slugs it shows, in nav order. */
export const homeSections = sections.map((section) => {
  const placed = slugsOf(section);
  const chosen = (picks[section.id] ?? []).filter((slug) => placed.includes(slug));
  return {
    id: section.id,
    title: section.title,
    categories: section.categories.map((c) => c.title),
    count: section.categories.reduce((n, c) => n + c.items.length, 0),
    slugs: (chosen.length === 3 ? chosen : placed).slice(0, 3),
  };
});
