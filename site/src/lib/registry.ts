import type { Component } from "svelte";
import { SHADCN_DEMOS } from "#lib/shadcn-demos/index.js";
import { componentSources } from "#lib/component-sources.js";

export type Icon = "area"|"line"|"bar"|"pie"|"ring"|"gauge"|"activity"|"dashboard"|"hash"|"spline"|"click"|"tag"|"form"|"square"|"tabs"|"move"|"sparkles"|"type"|"kanban"|"list"|"gantt"|"dot"|"statusicon"|"avatar"|"cast"|"deck"|"spotlight"|"compare"|"beam"|"animate"|"reveal"|"dialog"|"accordion"|"select"|"avataricon"|"prompt"|"conversation"|"thinking"|"typing"|"tradeicon"|"brand"|"testimonial"|"reviewpage"|"inbox"|"sidepanel"|"editor";

/** What the tile is for, which drives the filter on /components. The package is `pkg`. */
export type Group = "primitives" | "effects" | "ai" | "charts" | "tasks" | "pages";

export type Entry = {
  slug: string;
  title: string;
  group: Group;
  /** The `packages` id it ships in, read from its source path. */
  pkg: string;
  icon: Icon;
  description: string;
  /** Preview canvas minimum height, px. */
  height?: number;
  component: Component;
  source: string;
  /** Repo-relative paths of the component source file(s) behind this demo, for "Copy". */
  sourceFiles: string[];
};

const meta: Record<string, Omit<Entry, "slug" | "pkg" | "component" | "source" | "sourceFiles">> = {
  "area-chart": { title: "Area chart", group: "charts", icon: "area", description: "Stacked or layered areas with a crosshair, soft edges and an entrance sweep.", height: 380 },
  "line-chart": { title: "Line chart", group: "charts", icon: "line", description: "Multi-series lines with markers and a dashed tail for the period still in progress.", height: 380 },
  "bar-chart": { title: "Bar chart", group: "charts", icon: "bar", description: "Vertical or horizontal bars, stacked series, and a screen reader data table.", height: 380 },
  "donut-chart": { title: "Donut chart", group: "charts", icon: "pie", description: "A sweeping donut that shows the hovered slice in the middle, paired with a legend.", height: 340 },
  "ring-chart": { title: "Ring chart", group: "charts", icon: "ring", description: "Concentric progress rings with a hover glow and a counting center value.", height: 340 },
  "gauge-chart": { title: "Gauge chart", group: "charts", icon: "gauge", description: "A notched arc or a continuous ring, one number in the middle.", height: 300 },
  sparkline: { title: "Sparkline", group: "charts", icon: "activity", description: "A tiny trend line for tables and cards, with a dot on the latest value.", height: 240 },
  "stat-card": { title: "Stat card", group: "charts", icon: "dashboard", description: "A headline number that counts up, a trend pill and a chart in one card.", height: 360 },
  "number-chart": { title: "Number chart", group: "charts", icon: "hash", description: "A big figure with a delta that knows whether up is good news.", height: 240 },
  dashboard: { title: "Dashboard", group: "charts", icon: "dashboard", description: "A named section, number cards with a trend behind them, and panels in a row.", height: 560 },
  "chart-variants": { title: "Chart variants", group: "charts", icon: "dashboard", description: "The legend, the sparkline, number and stat card variants, the center-value gauge and the five chart tokens.", height: 1200 },
  "time-series-chart": { title: "Time series chart", group: "charts", icon: "spline", description: "Dates on the x axis, a comparison line and a crosshair tooltip.", height: 420 },
  button: { title: "Button", group: "primitives", icon: "click", description: "Five variants and sizes, one source of truth.", height: 220 },
  badge: { title: "Badge", group: "primitives", icon: "tag", description: "Filled, tinted and outlined labels, and a tone for severity.", height: 200 },
  "form-controls": { title: "Form controls", group: "primitives", icon: "form", description: "Input, switch, checkbox and progress on the same tokens.", height: 380 },
  card: { title: "Card", group: "primitives", icon: "square", description: "A surface with a header, content and footer.", height: 300 },
  tabs: { title: "Tabs", group: "primitives", icon: "tabs", description: "Tabs with a sliding indicator.", height: 260 },
  segmented: { title: "Segmented control", group: "primitives", icon: "tabs", description: "Tabs, filter or nav links on one bordered track, with a sliding pill, a badge note on a segment, an underline variant and an overflow menu.", height: 380 },
  picker: { title: "Picker", group: "primitives", icon: "select", description: "A command palette at popover scale: search, groups, hints and a footer.", height: 340 },
  "copy-button": { title: "Copy button", group: "primitives", icon: "click", description: "An icon or a chip that copies a value, then shows a check.", height: 200 },
  "hold-to-confirm": { title: "Hold to confirm", group: "primitives", icon: "click", description: "Press and hold to confirm a destructive action.", height: 200 },
  "simple-field": { title: "Simple field", group: "primitives", icon: "form", description: "A label, a hint or an error, and the control, with the message linked to it.", height: 280 },
  dialog: { title: "Dialog", group: "primitives", icon: "dialog", description: "A modal with a header, fields and a footer.", height: 240 },
  select: { title: "Select", group: "primitives", icon: "select", description: "A themed menu with grouped options.", height: 240 },
  accordion: { title: "Accordion", group: "primitives", icon: "accordion", description: "Stacked sections that open one at a time.", height: 320 },
  avatar: { title: "Avatar", group: "primitives", icon: "avataricon", description: "Initials that stand in for photos.", height: 200 },
  marquee: { title: "Marquee", group: "effects", icon: "move", description: "An endless ticker that pauses on hover, or a line of text that scrolls only when it overflows.", height: 200 },
  "border-beam": { title: "Border beam", group: "effects", icon: "sparkles", description: "A light that travels around a card's edge.", height: 240 },
  "text-effect": { title: "Text effect", group: "effects", icon: "type", description: "Words that fade in one after another.", height: 200 },
  spotlight: { title: "Spotlight", group: "effects", icon: "spotlight", description: "A soft beam that sweeps in on mount.", height: 220 },
  "magic-card": { title: "Magic card", group: "effects", icon: "spotlight", description: "A frosted card with a glow that follows the pointer.", height: 240 },
  "theme-toggle": { title: "Theme toggle", group: "effects", icon: "click", description: "A sun, moon and monitor button, or a sliding pill, that wipes the new theme out from the click.", height: 200 },
  "image-comparison": { title: "Image comparison", group: "effects", icon: "compare", description: "A wipe handle between before and after, with a bindable position, badges over each side, picture sources and an opening hint sweep.", height: 340 },
  "animated-beam": { title: "Animated beam", group: "effects", icon: "beam", description: "A gradient pulse that runs between two nodes.", height: 220 },
  "animated-group": { title: "Animated group", group: "effects", icon: "animate", description: "Staggered entrances with one replay button.", height: 220 },
  "image-reveal": { title: "Image reveal", group: "effects", icon: "reveal", description: "Photos that dissolve in through a pixel pass.", height: 340 },
  "kanban-board": { title: "Kanban board", group: "tasks", icon: "kanban", description: "Drag cards between lanes, by mouse or by keyboard.", height: 440 },
  "task-list": { title: "Task list", group: "tasks", icon: "list", description: "Rows grouped by status that fold, with drag between groups.", height: 440 },
  "task-gantt": { title: "Gantt", group: "tasks", icon: "gantt", description: "Bars you drag and resize by the day, with arrows between tasks.", height: 440 },
  "status-badge": { title: "Status badge", group: "tasks", icon: "tag", description: "Chips from one status config, with a tone dot and a busy spinner.", height: 200 },
  "status-dot": { title: "Status dot", group: "tasks", icon: "dot", description: "Dots in five shapes, from open ring to filled check.", height: 260 },
  "status-icon": { title: "Status icon", group: "tasks", icon: "statusicon", description: "Registry icons with a dot fallback for the rest.", height: 220 },
  inbox: { title: "Inbox", group: "tasks", icon: "inbox", description: "Approve, decline or steer what an agent isn't sure about, with the trace one click away.", height: 600 },
  "agent-avatar": { title: "Agent avatar", group: "ai", icon: "avatar", description: "A bot face in 18 shapes, with hats and glasses.", height: 260 },
  "agent-cast": { title: "Agent cast", group: "ai", icon: "cast", description: "The full cast on one card, ready to pick.", height: 300 },
  "slide-deck": { title: "Slide deck", group: "pages", icon: "deck", description: "A deck with reveals, overview and print, on a canvas that scales.", height: 380 },
  "ai-prompt": { title: "Prompt input", group: "ai", icon: "prompt", description: "Ask box with suggestions and send states.", height: 300 },
  "ai-thinking": { title: "Thinking dots", group: "ai", icon: "thinking", description: "Three dots while the answer forms.", height: 200 },
  "chat-typing": { title: "Typing dots", group: "ai", icon: "typing", description: "Who is typing, in three dots.", height: 200 },
  "trade-icon": { title: "Trade icon", group: "primitives", icon: "tradeicon", description: "One glyph per trade, same stroke.", height: 240 },
  "brand-tokens": { title: "Brand tokens", group: "pages", icon: "brand", description: "The palette as swatches, one source.", height: 240 },
  "testimonial-highlight": { title: "Testimonial", group: "pages", icon: "testimonial", description: "One featured quote, ready to place.", height: 360 },
  "side-panel": { title: "Side panel", group: "tasks", icon: "sidepanel", description: "A sheet for one record: badges, doors out to other tools, a copy-a-prompt handoff and a stats strip.", height: 220 },
  "rich-editor": { title: "Rich editor", group: "primitives", icon: "editor", description: "A Tiptap editor with a slash menu, an image toolbar and a Markdown bridge.", height: 420 },
  "review-page": { title: "Review page", group: "pages", icon: "reviewpage", description: "The full review UI mounted in a box.", height: 420 },
  "in-view": { title: "In view", group: "effects", icon: "reveal", description: "A block that animates in as it scrolls into view, and again each time it comes back.", height: 260 },
  magnetic: { title: "Magnetic", group: "effects", icon: "click", description: "A button that leans toward the pointer.", height: 200 },
  "progressive-blur": { title: "Progressive blur", group: "effects", icon: "sparkles", description: "A backdrop blur that ramps up toward one edge, with no runtime.", height: 260 },
  motion: { title: "Motion", group: "effects", icon: "animate", description: "Every CSS animation the kit ships, one live example each, with its import.", height: 900 },
  confirmation: { title: "Confirmation", group: "ai", icon: "dialog", description: "An agent asks before a risky step, then shows what was decided.", height: 300 },
  "loading-state": { title: "Pixel loader", group: "ai", icon: "thinking", description: "A pixel spinner with a label and a running clock.", height: 220 },
  reasoning: { title: "Reasoning", group: "ai", icon: "conversation", description: "A collapsible thought trail with how long it took.", height: 240 },
  "voice-waveform": { title: "Voice waveform", group: "ai", icon: "activity", description: "Bars that move while someone speaks. Click to pause.", height: 200 },
};

const components = import.meta.glob<{ default: Component }>("./demos/*.svelte", { eager: true });
const sources = import.meta.glob<string>("./demos/*.svelte", { eager: true, query: "?raw", import: "default" });

/** `packages/<pkg>/src/...`, except the agents, which ship inside ui but get their own section. */
const packageOf = (slug: string) => {
  const file = componentSources[slug]?.[0] ?? "";
  if (file.startsWith("packages/ui/src/agents/")) return "agents";
  return file.split("/")[1] ?? "ui";
};

const written: Entry[] = Object.keys(meta).map((slug) => {
  const path = `./demos/${slug}.svelte`;
  return {
    slug,
    ...meta[slug],
    pkg: packageOf(slug),
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
  group: "primitives",
  pkg: "ui",
  icon: "square",
  description: demo.note || `The ${demo.title} primitive.`,
  height: 280,
  component: demo.Comp,
  source: primitiveSources[`./shadcn-demos/${demo.name}.svelte`].trim(),
  sourceFiles: [],
}));

export const entries: Entry[] = [...written, ...primitives];

export const groups: { id: Group; label: string }[] = [
  { id: "primitives", label: "Primitives" },
  { id: "effects", label: "Effects" },
  { id: "ai", label: "AI and chat" },
  { id: "charts", label: "Charts" },
  { id: "tasks", label: "Tasks" },
  { id: "pages", label: "Pages and brand" },
];

/** The one place a package's name, title and blurb are written. Pages and sections read them from here. */
export type Package = { id: string; name: string; title: string; blurb: string };

export const packages: Package[] = [
  { id: "ui", name: "@heyramzi/ui", title: "UI", blurb: "Primitives, components and effects." },
  { id: "charts", name: "@heyramzi/charts", title: "Charts", blurb: "Area, line, bar, donut, ring and gauge charts, sparklines and stat cards on LayerChart, one set of tokens." },
  { id: "agents", name: "@heyramzi/ui/agents", title: "Agents", blurb: "Bot avatars and a cast page." },
  { id: "tasks", name: "@heyramzi/tasks", title: "Tasks", blurb: "One set of tasks as a board, a list or a gantt, plus status badges, dots and icons from one config." },
  { id: "slides", name: "@heyramzi/slides", title: "Slides", blurb: "Decks on a fixed canvas: reveals, overview, presenter view and print." },
  { id: "marketing", name: "@heyramzi/marketing", title: "Marketing", blurb: "Brand tokens and testimonials. It also ships Umami analytics, Sentry errors and an HTML-to-image pipeline, which run on the server and have nothing to show here." },
  { id: "rich-editor", name: "@heyramzi/rich-editor", title: "Rich editor", blurb: "A Tiptap editor, an SSR renderer for the saved JSON and a Markdown bridge." },
  { id: "review", name: "@heyramzi/review", title: "Review", blurb: "The review page, mounted anywhere." },
];

export const packageById = (id: string) => {
  const found = packages.find((p) => p.id === id);
  if (!found) throw new Error(`No package "${id}" in the registry`);
  return found;
};

export const groupLabel = (id: Group) => groups.find((g) => g.id === id)?.label ?? id;

export const bySlug = (slug: string) => entries.find((e) => e.slug === slug);
