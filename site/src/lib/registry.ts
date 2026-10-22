import type { Component } from "svelte";
import { SHADCN_DEMOS } from "#lib/shadcn-demos/index.js";
import { componentSources } from "#lib/component-sources.js";

export type Icon = "area"|"line"|"bar"|"pie"|"ring"|"gauge"|"activity"|"dashboard"|"hash"|"spline"|"click"|"tag"|"form"|"square"|"tabs"|"move"|"sparkles"|"type"|"kanban"|"list"|"gantt"|"dot"|"statusicon"|"avatar"|"cast"|"deck"|"spotlight"|"compare"|"beam"|"animate"|"reveal"|"dialog"|"accordion"|"select"|"avataricon"|"prompt"|"conversation"|"thinking"|"typing"|"tradeicon"|"brand"|"testimonial"|"reviewpage"|"inbox"|"sidepanel"|"editor";

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
      { title: "Actions", items: ["button", "copy-button", "hold-to-confirm", "toggle", "toggle-group", "theme-toggle"] },
      { title: "Feedback", items: ["badge", "alert", "progress", "spinner", "skeleton", "sonner", "empty"] },
      { title: "Data display", items: ["avatar", "language-flag", "mark", "separator", "card", "accordion", "collapsible", "scroll-area", "code-block", "table", "table-view", "data-table"] },
      { title: "Inputs", items: ["label", "field", "simple-field", "input", "textarea", "input-otp", "checkbox", "radio-group", "switch", "slider", "star-rating-input", "select", "calendar"] },
      { title: "Overlays", items: ["tooltip", "hover-card", "popover", "dropdown-menu", "context-menu", "dialog", "alert-dialog", "sheet", "command", "picker"] },
      { title: "Navigation", items: ["tabs", "segmented", "locale-switch", "breadcrumb", "toolbar"] },
    ],
  },
  {
    id: "effects",
    title: "Effects",
    categories: [
      { title: "Text", items: ["text-effect", "marquee"] },
      { title: "Light", items: ["spotlight", "border-beam", "magic-card", "animated-beam", "progressive-blur", "shader-gradient"] },
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
      { title: "Chat", items: ["message", "bubble", "attachment", "marker", "message-scroller", "trace", "suggestion", "ai-prompt", "ai-button", "reasoning", "confirmation", "chat-typing", "ai-thinking", "loading-state", "generation-progress", "voice-waveform"] },
      { title: "Agents", items: ["agent-avatar", "agent-cast"] },
      { title: "Tasks", items: ["status-dot", "status-badge", "status-icon", "task-list", "kanban-board", "task-gantt", "side-panel", "inbox", { title: "Task app", href: "/tasks" }] },
      { title: "Editor", items: ["inline-editor", "rich-editor"] },
      { title: "Layouts", items: ["section-card", "doc-page", "list-page", "dashboard"] },
      { title: "Onboarding", items: [{ title: "Page tour", href: "/onboarding" }] },
      { title: "Slides", items: ["slide-deck", { title: "Deck and presenter", href: "/slides" }] },
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

type Meta = Omit<Entry, "slug" | "section" | "category" | "component" | "source" | "sourceFiles">;

const meta: Record<string, Meta> = {
  colors: { title: "Colors", icon: "brand", description: "The colour tokens the kit reads, in the current theme.", height: 520 },
  theming: { title: "Theming", icon: "brand", description: "One brand colour restyles every component on the page.", height: 300 },
  icon: { title: "Icon", icon: "sparkles", description: "A Phosphor icon at any size and weight, and a raw SVG file drawn inline.", height: 260 },
  "sf-symbols": { title: "SF Symbols", icon: "sparkles", description: "Real Apple SF Symbols, drawn from the shared path set.", height: 360 },
  "language-flag": { title: "Language flag", icon: "tag", description: "A small flag for a language code, with an optional label.", height: 160 },
  mark: { title: "Mark", icon: "brand", description: "A brand logo at glyph size that falls back to the initial.", height: 240 },
  "data-table": { title: "Data table", icon: "list", description: "Searchable, sortable client table with pagination, a loading skeleton and row arrows.", height: 420 },
  "star-rating-input": { title: "Star rating input", icon: "form", description: "A star rating you set, read back or lock, in two sizes.", height: 260 },
  "locale-switch": { title: "Locale switch", icon: "tabs", description: "A segmented language picker with a flag beside each code.", height: 160 },
  "shader-gradient": { title: "Shader gradient", icon: "sparkles", description: "An animated WebGL mesh gradient that fills its box.", height: 340 },
  "interactive-hover-button": { title: "Interactive hover button", icon: "click", description: "A call-to-action button with a spinning edge and a fill that swells on hover.", height: 200 },
  suggestion: { title: "Suggestion", icon: "prompt", description: "Prompt chips that fill the input when you click one.", height: 200 },
  "ai-button": { title: "AI button", icon: "sparkles", description: "A sparkle button that shows a spinner while the model works.", height: 160 },
  "generation-progress": { title: "Generation progress", icon: "thinking", description: "A progress strip for a long generation, with steps, timer and a failed state.", height: 260 },
  "inline-editor": { title: "Inline editor", icon: "editor", description: "A single-block text editor with marks and lists, driven by a toolbar.", height: 300 },
  "list-page": { title: "List page", icon: "list", description: "A toolbar with search and filters over a list and detail split.", height: 520 },
  "area-chart": { title: "Area chart", icon: "area", description: "Stacked or layered areas with a crosshair, soft edges and an entrance sweep.", height: 380 },
  "line-chart": { title: "Line chart", icon: "line", description: "Multi-series lines with markers and a dashed tail for the period still in progress.", height: 380 },
  "bar-chart": { title: "Bar chart", icon: "bar", description: "Vertical or horizontal bars, stacked series, and a screen reader data table.", height: 380 },
  "donut-chart": { title: "Donut chart", icon: "pie", description: "A sweeping donut that shows the hovered slice in the middle, paired with a legend.", height: 340 },
  "ring-chart": { title: "Ring chart", icon: "ring", description: "Concentric progress rings with a hover glow and a counting center value.", height: 340 },
  "gauge-chart": { title: "Gauge chart", icon: "gauge", description: "A notched arc or a continuous ring, one number in the middle.", height: 300 },
  sparkline: { title: "Sparkline", icon: "activity", description: "A tiny trend line for tables and cards, with a dot on the latest value.", height: 240 },
  "stat-card": { title: "Stat card", icon: "dashboard", description: "A headline number that counts up, a trend pill and a chart in one card.", height: 360 },
  "number-chart": { title: "Number chart", icon: "hash", description: "A big figure with a delta that knows whether up is good news.", height: 240 },
  dashboard: { title: "Dashboard", icon: "dashboard", description: "A named section, number cards with a trend behind them, and panels in a row.", height: 560 },
  "chart-variants": { title: "Chart parts", icon: "dashboard", description: "The legend, the sparkline, number and stat card variants, the center-value gauge and the five chart tokens.", height: 1200 },
  "time-series-chart": { title: "Time series chart", icon: "spline", description: "Dates on the x axis, a comparison line and a crosshair tooltip.", height: 420 },
  button: { title: "Button", icon: "click", description: "Five variants and sizes, one source of truth.", height: 220 },
  badge: { title: "Badge", icon: "tag", description: "Filled, tinted and outlined labels, and a tone for severity.", height: 200 },
  card: { title: "Card", icon: "square", description: "A surface with a header, content and footer.", height: 300 },
  tabs: { title: "Tabs", icon: "tabs", description: "Tabs with a sliding indicator.", height: 260 },
  segmented: { title: "Segmented control", icon: "tabs", description: "Tabs, filter or nav links on one bordered track, with a sliding pill, a badge note on a segment, an underline variant and an overflow menu.", height: 380 },
  picker: { title: "Picker", icon: "select", description: "A command palette at popover scale: search, groups, hints and a footer.", height: 340 },
  toolbar: { title: "Toolbar", icon: "list", description: "One row at any width. Wide, search, tabs and the view switch sit inline. In a narrow pane each folds into a menu and the row never wraps.", height: 360 },
  "copy-button": { title: "Copy button", icon: "click", description: "An icon or a chip that copies a value, then shows a check.", height: 200 },
  "hold-to-confirm": { title: "Hold to confirm", icon: "click", description: "Press and hold to confirm a destructive action.", height: 200 },
  "simple-field": { title: "Simple field", icon: "form", description: "A label, a hint or an error, and the control, with the message linked to it.", height: 280 },
  dialog: { title: "Dialog", icon: "dialog", description: "A modal with a header, fields and a footer.", height: 240 },
  select: { title: "Select", icon: "select", description: "A themed menu with grouped options.", height: 240 },
  accordion: { title: "Accordion", icon: "accordion", description: "Stacked sections that open one at a time.", height: 320 },
  avatar: { title: "Avatar", icon: "avataricon", description: "Initials that stand in for photos.", height: 200 },
  marquee: { title: "Marquee", icon: "move", description: "An endless ticker that pauses on hover, or a line of text that scrolls only when it overflows.", height: 200 },
  "border-beam": { title: "Border beam", icon: "sparkles", description: "A light that travels around a card's edge.", height: 240 },
  "text-effect": { title: "Text effect", icon: "type", description: "Words that fade in one after another.", height: 200 },
  spotlight: { title: "Spotlight", icon: "spotlight", description: "A soft beam that sweeps in on mount.", height: 220 },
  "magic-card": { title: "Magic card", icon: "spotlight", description: "A frosted card with a glow that follows the pointer.", height: 240 },
  "theme-toggle": { title: "Theme toggle", icon: "click", description: "A sun, moon and monitor button, or a sliding pill, that wipes the new theme out from the click.", height: 200 },
  "image-comparison": { title: "Image comparison", icon: "compare", description: "A wipe handle between before and after, with a bindable position, badges over each side, picture sources and an opening hint sweep.", height: 340 },
  "animated-beam": { title: "Animated beam", icon: "beam", description: "A gradient pulse that runs between two nodes.", height: 220 },
  "animated-group": { title: "Animated group", icon: "animate", description: "Staggered entrances with one replay button.", height: 220 },
  "image-reveal": { title: "Image reveal", icon: "reveal", description: "Photos that dissolve in through a pixel pass.", height: 340 },
  "kanban-board": { title: "Kanban board", icon: "kanban", description: "Drag cards between lanes, by mouse or by keyboard.", height: 440 },
  "task-list": { title: "Task list", icon: "list", description: "Rows grouped by status that fold, with drag between groups.", height: 440 },
  "task-gantt": { title: "Gantt", icon: "gantt", description: "Bars you drag and resize by the day, with arrows between tasks.", height: 440 },
  "status-badge": { title: "Status badge", icon: "tag", description: "Chips from one status config, with a tone dot and a busy spinner.", height: 200 },
  "status-dot": { title: "Status dot", icon: "dot", description: "Dots in five shapes, from open ring to filled check.", height: 260 },
  "status-icon": { title: "Status icon", icon: "statusicon", description: "Registry icons with a dot fallback for the rest.", height: 220 },
  inbox: { title: "Inbox", icon: "inbox", description: "Approve, decline or steer what an agent isn't sure about, with the trace one click away.", height: 600 },
  "agent-avatar": { title: "Agent avatar", icon: "avatar", description: "A bot face in 18 shapes, with hats and glasses.", height: 260 },
  "agent-cast": { title: "Agent cast", icon: "cast", description: "The full cast on one card, ready to pick.", height: 300 },
  "slide-deck": { title: "Slide deck", icon: "deck", description: "A deck with reveals, overview and print, on a canvas that scales.", height: 380 },
  "ai-prompt": { title: "Prompt input", icon: "prompt", description: "Ask box with suggestions and send states.", height: 300 },
  "ai-thinking": { title: "Thinking dots", icon: "thinking", description: "Three dots while the answer forms.", height: 200 },
  "chat-typing": { title: "Typing dots", icon: "typing", description: "Who is typing, in three dots.", height: 200 },
  "trade-icon": { title: "Trade icon", icon: "tradeicon", description: "One glyph per trade, same stroke.", height: 240 },
  "doc-page": { title: "Doc page", icon: "list", description: "One page anatomy for documentation: an icon, title and summary header, a reading column and an On this page rail that becomes a bar on a narrow pane.", height: 540 },
  "section-card": { title: "Section card", icon: "form", description: "A settings page kit: a card with a fixed-height header and a line under it, a section header with a count chip, and a field row whose action sits at the control's height.", height: 380 },
  "table-view": { title: "Table view", icon: "list", description: "A read-only table from columns and rows: right-aligned tabular figures, a footer row, a custom cell snippet and a sideways scroll below its minimum width.", height: 320 },
  "side-panel": { title: "Side panel", icon: "sidepanel", description: "A sheet for one record: badges, doors out to other tools, a copy-a-prompt handoff and a stats strip.", height: 220 },
  "rich-editor": { title: "Rich editor", icon: "editor", description: "A Tiptap editor with a slash menu, an image toolbar and a Markdown bridge.", height: 420 },
  "in-view": { title: "In view", icon: "reveal", description: "A block that animates in as it scrolls into view, and again each time it comes back.", height: 260 },
  magnetic: { title: "Magnetic", icon: "click", description: "A button that leans toward the pointer.", height: 200 },
  "progressive-blur": { title: "Progressive blur", icon: "sparkles", description: "A backdrop blur that ramps up toward one edge, with no runtime.", height: 260 },
  motion: { title: "Motion", icon: "animate", description: "Every CSS animation the kit ships, one live example each, with its import.", height: 900 },
  confirmation: { title: "Confirmation", icon: "dialog", description: "An agent asks before a risky step, then shows what was decided.", height: 300 },
  "loading-state": { title: "Pixel loader", icon: "thinking", description: "A pixel spinner with a label and a running clock.", height: 220 },
  reasoning: { title: "Reasoning", icon: "conversation", description: "A collapsible thought trail with how long it took.", height: 240 },
  "voice-waveform": { title: "Voice waveform", icon: "activity", description: "Bars that move while someone speaks. Click to pause.", height: 200 },
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
const sources = import.meta.glob<string>("./demos/*.svelte", { eager: true, query: "?raw", import: "default" });

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

const primitiveSources = import.meta.glob<string>("./shadcn-demos/*.svelte", { eager: true, query: "?raw", import: "default" });

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
  if (!all.some((e) => e.slug === slug)) throw new Error(`registry: sections place "${slug}", which has no demo`);
}

/** Every demo, in sidebar order. */
export const entries: Entry[] = [...placement.keys()].map((slug) => all.find((e) => e.slug === slug)!);

export const bySlug = (slug: string) => entries.find((e) => e.slug === slug);

export const sectionById = (id: string) => sections.find((s) => s.id === id);

/** The anchor a category heading carries on its section page. */
export const categoryId = (title: string) => title.toLowerCase().replaceAll(" ", "-");

/** A sidebar row's link and label, whether it's a demo or a page. */
export const itemLink = (item: string | PageLink): PageLink =>
  typeof item === "string" ? { title: bySlug(item)!.title, href: `/components/${item}` } : item;

/** The import a demo leads with, for the line under its title. */
export const importOf = (entry: Entry) => entry.source.match(/from "(@heyramzi\/[^"]+)"/)?.[1];
