import type { Component } from "svelte";
import { SHADCN_DEMOS } from "#lib/shadcn-demos/index.js";
import { componentSources } from "#lib/component-sources.js";
import { meta } from "#lib/registry-meta.js";

export type Icon =
  | "area"
  | "line"
  | "bar"
  | "pie"
  | "ring"
  | "gauge"
  | "activity"
  | "dashboard"
  | "hash"
  | "spline"
  | "click"
  | "tag"
  | "form"
  | "square"
  | "tabs"
  | "move"
  | "sparkles"
  | "type"
  | "kanban"
  | "list"
  | "gantt"
  | "dot"
  | "statusicon"
  | "avatar"
  | "cast"
  | "deck"
  | "spotlight"
  | "compare"
  | "beam"
  | "animate"
  | "reveal"
  | "dialog"
  | "accordion"
  | "select"
  | "avataricon"
  | "prompt"
  | "conversation"
  | "thinking"
  | "typing"
  | "tradeicon"
  | "brand"
  | "testimonial"
  | "reviewpage"
  | "inbox"
  | "sidepanel"
  | "editor";

/** A sidebar row that isn't a single demo: a full page such as the task app or the deck. */
export type PageLink = { title: string; href: string };

export type Category = { title: string; items: (string | PageLink)[] };
export type Section = { id: string; title: string; categories: Category[] };

/**
 * The one order the site reads, from the tokens up to whole screens. Each section only builds on
 * the ones above it, and inside a category the simplest part comes first. Every demo sits in
 * exactly one place: the checks at the bottom fail the build otherwise.
 */
export const sections: Section[] = [
  {
    id: "foundations",
    title: "Foundations",
    categories: [
      { title: "Theming", items: ["colors", "theming"] },
      { title: "Icons", items: ["icon", "trade-icon", "sf-symbols"] },
      { title: "Motion", items: ["motion"] },
    ],
  },
  {
    id: "components",
    title: "Components",
    categories: [
      {
        title: "Actions",
        items: [
          "button",
          "copy-button",
          "hold-to-confirm",
          "toggle",
          "toggle-group",
          "theme-toggle",
        ],
      },
      {
        title: "Feedback",
        items: ["badge", "alert", "progress", "spinner", "skeleton", "sonner", "empty"],
      },
      {
        title: "Data display",
        items: [
          "avatar",
          "language-flag",
          "mark",
          "separator",
          "card",
          "accordion",
          "collapsible",
          "scroll-area",
          "code-block",
          "table",
          "table-view",
          "data-table",
        ],
      },
      {
        title: "Inputs",
        items: [
          "label",
          "field",
          "simple-field",
          "input",
          "textarea",
          "input-otp",
          "checkbox",
          "radio-group",
          "switch",
          "slider",
          "star-rating-input",
          "tags-input",
          "select",
          "calendar",
        ],
      },
      {
        title: "Overlays",
        items: [
          "tooltip",
          "hover-card",
          "popover",
          "dropdown-menu",
          "context-menu",
          "dialog",
          "alert-dialog",
          "sheet",
          "command",
          "picker",
        ],
      },
      {
        title: "Navigation",
        items: ["tabs", "segmented", "locale-switch", "breadcrumb", "toolbar"],
      },
    ],
  },
  {
    id: "effects",
    title: "Effects",
    categories: [
      { title: "Text", items: ["text-effect", "marquee"] },
      {
        title: "Light",
        items: [
          "spotlight",
          "border-beam",
          "magic-card",
          "animated-beam",
          "progressive-blur",
          "shader-gradient",
        ],
      },
      { title: "Reveal", items: ["in-view", "animated-group", "image-reveal"] },
      { title: "Pointer", items: ["magnetic", "interactive-hover-button", "image-comparison"] },
    ],
  },
  {
    id: "charts",
    title: "Charts",
    categories: [
      { title: "Cartesian", items: ["area-chart", "line-chart", "bar-chart", "time-series-chart"] },
      { title: "Radial", items: ["donut-chart", "ring-chart", "gauge-chart"] },
      { title: "Figures", items: ["number-chart", "sparkline", "stat-card"] },
      { title: "Parts", items: ["chart-variants"] },
    ],
  },
  {
    id: "blocks",
    title: "Blocks",
    categories: [
      {
        title: "Chat",
        items: [
          "message",
          "bubble",
          "attachment",
          "marker",
          "message-scroller",
          "trace",
          "suggestion",
          "ai-prompt",
          "ai-button",
          "reasoning",
          "confirmation",
          "chat-typing",
          "ai-thinking",
          "loading-state",
          "generation-progress",
          "voice-waveform",
        ],
      },
      { title: "Agents", items: ["agent-avatar", "agent-cast"] },
      {
        title: "Tasks",
        items: [
          "status-dot",
          "status-badge",
          "status-icon",
          "task-list",
          "kanban-board",
          "task-gantt",
          "side-panel",
          "thread",
          "threaded-inbox",
          { title: "Task app", href: "/tasks" },
        ],
      },
      { title: "Editor", items: ["inline-editor", "rich-editor"] },
      { title: "Layouts", items: ["section-card", "doc-page", "list-page", "dashboard"] },
      { title: "Onboarding", items: [{ title: "Page tour", href: "/onboarding" }] },
      { title: "Slides", items: ["slide-deck", { title: "Deck and presenter", href: "/slides" }] },
      { title: "Canvas", items: ["canvas"] },
    ],
  },
];

export type Entry = {
  slug: string;
  title: string;
  section: string;
  category: string;
  icon: Icon;
  description: string;
  /** Preview canvas minimum height, px. */
  height?: number;
  component: Component;
  source: string;
  /** Repo-relative paths of the component source file(s) behind this demo, for "Copy". */
  sourceFiles: string[];
};

/** Where each slug sits, read off `sections`. */
const placement = new Map<string, { section: string; category: string }>();
for (const section of sections) {
  for (const category of section.categories) {
    for (const item of category.items) {
      if (typeof item !== "string") continue;
      if (placement.has(item)) throw new Error(`registry: "${item}" is placed twice in sections`);
      placement.set(item, { section: section.id, category: category.title });
    }
  }
}

const place = (slug: string) => {
  const found = placement.get(slug);
  if (!found) throw new Error(`registry: demo "${slug}" has no place in sections`);
  return found;
};

const components = import.meta.glob<{ default: Component }>("./demos/*.svelte", { eager: true });
const sources = import.meta.glob<string>("./demos/*.svelte", {
  eager: true,
  query: "?raw",
  import: "default",
});

const written: Entry[] = Object.keys(meta).map((slug) => {
  const path = `./demos/${slug}.svelte`;
  return {
    slug,
    ...meta[slug],
    ...place(slug),
    component: components[path].default,
    source: sources[path].trim(),
    sourceFiles: componentSources[slug] ?? [],
  };
});

const primitiveSources = import.meta.glob<string>("./shadcn-demos/*.svelte", {
  eager: true,
  query: "?raw",
  import: "default",
});

/**
 * The other shadcn primitives, each shown by upstream's own demo. `pnpm sync:shadcn` writes the files
 * and the list, so a primitive reaches the site by being synced, never by being typed here. A name a
 * demo above already uses keeps that demo.
 */
const primitives: Entry[] = SHADCN_DEMOS.filter((demo) => !(demo.name in meta)).map((demo) => ({
  slug: demo.name,
  title: demo.title,
  ...place(demo.name),
  icon: "square",
  description: demo.note || `The ${demo.title} primitive.`,
  height: 280,
  component: demo.Comp,
  source: primitiveSources[`./shadcn-demos/${demo.name}.svelte`].trim(),
  sourceFiles: [],
}));

const all = [...written, ...primitives];
for (const slug of placement.keys()) {
  if (!all.some((e) => e.slug === slug))
    throw new Error(`registry: sections place "${slug}", which has no demo`);
}

/** Every demo, in sidebar order. */
export const entries: Entry[] = [...placement.keys()].map((slug) =>
  all.find((e) => e.slug === slug)!,
);

export const bySlug = (slug: string) => entries.find((e) => e.slug === slug);

export const sectionById = (id: string) => sections.find((s) => s.id === id);

/** The anchor a category heading carries on its section page. */
export const categoryId = (title: string) => title.toLowerCase().replaceAll(" ", "-");

/** A sidebar row's link and label, whether it's a demo or a page. */
export const itemLink = (item: string | PageLink): PageLink =>
  typeof item === "string" ? { title: bySlug(item)!.title, href: `/components/${item}` } : item;

/** The import a demo leads with, for the line under its title. */
export const importOf = (entry: Entry) => entry.source.match(/from "(@heyramzi\/[^"]+)"/)?.[1];
