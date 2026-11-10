import type { Component } from "svelte";
import { cardOf, sections } from "#lib/nav.js";

type Pick = {
  slug: string;
  load: () => Promise<{ default: Component }>;
  /** The tile's height, px: the lazy box holds it from the first paint so nothing below moves. */
  height: number;
  /** Grid classes. Each row splits the width its own way: 4 and 2, 2 and 4, then halves. */
  span: string;
};

/**
 * The live parts under the hero, picked by hand to run at full size in their tile. Each one
 * loads only as it nears the viewport: the area chart and the avatars alone outweigh the rest
 * of the page.
 */
const chosen: Pick[] = [
  {
    slug: "area-chart",
    load: () => import("#lib/demos/area-chart.svelte"),
    height: 360,
    span: "sm:col-span-2 lg:col-span-4",
  },
  {
    slug: "calendar",
    load: () => import("#lib/shadcn-demos/calendar.svelte"),
    height: 360,
    span: "lg:col-span-2",
  },
  {
    slug: "magnetic",
    load: () => import("#lib/demos/magnetic.svelte"),
    height: 240,
    span: "lg:col-span-2",
  },
  {
    slug: "ai-prompt",
    load: () => import("#lib/demos/ai-prompt.svelte"),
    height: 240,
    span: "sm:col-span-2 lg:col-span-4",
  },
  {
    slug: "agent-avatar",
    load: () => import("#lib/demos/agent-avatar.svelte"),
    height: 260,
    span: "sm:col-span-2 lg:col-span-3",
  },
  {
    slug: "gauge-chart",
    load: () => import("#lib/demos/gauge-chart.svelte"),
    height: 260,
    span: "sm:col-span-2 lg:col-span-3",
  },
];

export const picks = chosen.map((pick) => ({ ...pick, title: cardOf(pick.slug).title }));

/** Every section with its categories and part count, in nav order. */
export const sectionIndex = sections.map((section) => ({
  id: section.id,
  title: section.title,
  categories: section.categories.map((c) => c.title).join(", "),
  count: section.categories.reduce((n, c) => n + c.items.length, 0),
}));
