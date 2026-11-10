import { SHADCN_DEMOS } from "#lib/shadcn-demos/index.js";
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
 * The site's one order, tokens up to whole screens, and every demo sits in exactly one place or
 * the checks below fail the build.
 */
export const sections: Section[] = [
  {
    id: "foundations",
    title: "Foundations",
    categories: [
      { title: "Tokens", items: ["colors", "theming", "motion"] },
      { title: "Icons", items: ["icon", "sf-symbols"] },
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
          "button-group",
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
          "item",
          "tag-chip",
          "kbd",
          "code-block",
          "table",
          "table-view",
          "data-table",
        ],
      },
      {
        title: "Layout",
        items: ["card", "separator", "accordion", "collapsible", "scroll-area"],
      },
      {
        title: "Inputs",
        items: [
          "label",
          "field",
          "simple-field",
          "input",
          "input-group",
          "textarea",
          "input-otp",
          "checkbox",
          "radio-group",
          "switch",
          "slider",
          "star-rating-input",
          "tags-input",
          "select",
          "native-select",
          "combobox",
          "calendar",
          "date-picker",
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
        items: ["tabs", "segmented", "breadcrumb", "pagination", "toolbar", "sidebar"],
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
          "loading-state",
          "generation-progress",
          "voice-waveform",
        ],
      },
      { title: "Agents", items: ["agent-avatar", "agent-cast"] },
      {
        title: "Work",
        items: [
          "status-dot",
          "status-badge",
          "status-icon",
          "work-parts",
          "task-list",
          "kanban-board",
          "task-gantt",
          "side-panel",
          "thread",
          "threaded-inbox",
          "triage-queue",
          { title: "Task app", href: "/work" },
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

/**
 * What every page knows about a demo without loading it. `demo` is the file `registry.ts` loads
 * on the demo's own page, relative to `site/src/lib`.
 */
export type Card = {
  slug: string;
  title: string;
  section: string;
  category: string;
  icon: Icon;
  description: string;
  /** Preview canvas minimum height, px. */
  height?: number;
  demo: string;
};

/** Where each slug sits, read off `sections`. */
const placement = new Map<string, { section: string; category: string }>();
for (const section of sections) {
  for (const category of section.categories) {
    for (const item of category.items) {
      if (typeof item !== "string") continue;
      if (placement.has(item)) throw new Error(`nav: "${item}" is placed twice in sections`);
      placement.set(item, { section: section.id, category: category.title });
    }
  }
}

const place = (slug: string) => {
  const found = placement.get(slug);
  if (!found) throw new Error(`nav: demo "${slug}" has no place in sections`);
  return found;
};

const written: Card[] = Object.keys(meta).map((slug) => ({
  slug,
  ...meta[slug],
  ...place(slug),
  demo: `./demos/${slug}.svelte`,
}));

/**
 * The other shadcn primitives, with upstream's demos: `pnpm sync:shadcn` writes the list, so a
 * primitive reaches the site by being synced, never typed here.
 */
const primitives: Card[] = SHADCN_DEMOS.filter((demo) => !(demo.name in meta)).map((demo) => ({
  slug: demo.name,
  title: demo.title,
  ...place(demo.name),
  icon: "square",
  description: demo.note || `The ${demo.title} primitive.`,
  height: 280,
  demo: `./shadcn-demos/${demo.name}.svelte`,
}));

const all = new Map([...written, ...primitives].map((c) => [c.slug, c]));

/** Every demo, in sidebar order. */
export const cards: Card[] = [...placement.keys()].map((slug) => {
  const card = all.get(slug);
  if (!card) throw new Error(`nav: sections place "${slug}", which has no demo`);
  return card;
});

export const cardBySlug = (slug: string) => cards.find((c) => c.slug === slug);

/** A slug the sections place, which the checks above already proved has a demo. */
export const cardOf = (slug: string): Card => {
  const card = cardBySlug(slug);
  if (!card) throw new Error(`nav: no demo for "${slug}"`);
  return card;
};

export const sectionById = (id: string) => sections.find((s) => s.id === id);

/** The anchor a category heading carries on its section page. */
export const categoryId = (title: string) => title.toLowerCase().replaceAll(" ", "-");

/** A sidebar row's link and label, whether it's a demo or a page. */
export const itemLink = (item: string | PageLink): PageLink =>
  typeof item === "string" ? { title: cardOf(item).title, href: `/components/${item}` } : item;
