import type { Component } from "svelte";

export type Icon = "area"|"line"|"bar"|"pie"|"ring"|"gauge"|"activity"|"dashboard"|"hash"|"spline"|"click"|"tag"|"form"|"square"|"tabs"|"move"|"sparkles"|"type"|"kanban"|"list"|"gantt"|"dot"|"statusicon"|"avatar"|"cast"|"deck"|"spotlight"|"compare"|"beam"|"animate"|"reveal"|"dialog"|"accordion"|"select"|"avataricon"|"prompt"|"conversation"|"thinking"|"composer"|"typing"|"tradeicon"|"brand"|"testimonial"|"reviewpage";

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

/** Where each demo's component lives. Several paths list the main component first. */
const componentSources: Record<string, string[]> = {
  "area-chart": ["packages/charts/src/area-chart.svelte"],
  "line-chart": ["packages/charts/src/line-chart.svelte"],
  "bar-chart": ["packages/charts/src/bar-chart.svelte"],
  "donut-chart": ["packages/charts/src/donut-chart.svelte"],
  "ring-chart": ["packages/charts/src/ring-chart.svelte"],
  "gauge-chart": ["packages/charts/src/gauge-chart.svelte"],
  sparkline: ["packages/charts/src/sparkline.svelte"],
  "stat-card": ["packages/charts/src/stat-card.svelte"],
  "number-chart": ["packages/charts/src/number-chart.svelte"],
  "time-series-chart": ["packages/charts/src/time-series-chart.svelte"],
  button: ["packages/ui/src/shadcn/button/button.svelte"],
  badge: ["packages/ui/src/shadcn/badge/badge.svelte"],
  "form-controls": [
    "packages/ui/src/shadcn/input/input.svelte",
    "packages/ui/src/shadcn/switch/switch.svelte",
    "packages/ui/src/shadcn/checkbox/checkbox.svelte",
    "packages/ui/src/shadcn/progress/progress.svelte",
  ],
  card: ["packages/ui/src/shadcn/card/card.svelte"],
  tabs: ["packages/ui/src/shadcn/tabs/tabs-list.svelte", "packages/ui/src/lib/sliding-pill.ts"],
  dialog: ["packages/ui/src/shadcn/dialog/dialog.svelte", "packages/ui/src/shadcn/dialog/dialog-content.svelte"],
  select: ["packages/ui/src/shadcn/select/select.svelte"],
  accordion: ["packages/ui/src/shadcn/accordion/accordion.svelte"],
  avatar: ["packages/ui/src/shadcn/avatar/avatar.svelte"],
  marquee: ["packages/ui/src/effects/marquee/Marquee.svelte"],
  "border-beam": ["packages/ui/src/effects/border-beam/BorderBeam.svelte"],
  "text-effect": ["packages/ui/src/effects/reveal/TextEffect.svelte"],
  spotlight: ["packages/ui/src/effects/spotlight/Spotlight.svelte"],
  "theme-toggle": ["packages/ui/src/effects/theme-toggle/ThemeToggle.svelte", "packages/ui/src/lib/theme-transition.ts"],
  "image-comparison": ["packages/ui/src/effects/image-comparison/ImageComparison.svelte"],
  "animated-beam": ["packages/ui/src/effects/animated-beam/AnimatedBeam.svelte"],
  "animated-group": ["packages/ui/src/effects/reveal/AnimatedGroup.svelte"],
  "image-reveal": ["packages/ui/src/effects/image-reveal/ImageReveal.svelte"],
  "kanban-board": ["packages/tasks/src/kanban-board.svelte"],
  "task-list": ["packages/tasks/src/task-list.svelte"],
  "task-gantt": ["packages/tasks/src/task-gantt.svelte"],
  "status-badge": ["packages/tasks/src/status-badge.svelte"],
  "status-dot": ["packages/tasks/src/status-dot.svelte"],
  "status-icon": ["packages/tasks/src/status-icon.svelte"],
  "agent-avatar": ["packages/ui/src/agents/agent-avatar.svelte"],
  "agent-cast": ["packages/ui/src/agents/agent-cast.svelte"],
  "slide-deck": ["packages/slides/src/Deck.svelte", "packages/slides/src/Slide.svelte", "packages/slides/src/Fragment.svelte"],
  "ai-prompt": ["packages/ui/src/ai/prompt-input/PromptInput.svelte"],
  "ai-conversation": ["packages/ui/src/ai/conversation/Conversation.svelte", "packages/ui/src/ai/response/Response.svelte"],
  "ai-thinking": ["packages/ui/src/ai/thinking-dots/ThinkingDots.svelte"],
  "chat-composer": ["packages/ui/src/ai/composer/Composer.svelte"],
  "chat-typing": ["packages/ui/src/ai/typing-dots/TypingDots.svelte"],
  "trade-icon": ["packages/ui/src/icons/TradeIcon.svelte"],
  "brand-tokens": ["packages/marketing/src/brand/index.ts"],
  "testimonial-highlight": ["packages/marketing/src/testimonials/svelte/TestimonialHighlight.svelte"],
  "review-page": ["packages/review/src/mount.ts"],
};

export { componentSources };

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
  "time-series-chart": { title: "Time series chart", group: "charts", icon: "spline", description: "Dates on the x axis, a comparison line and a crosshair tooltip.", height: 420 },
  button: { title: "Button", group: "primitives", icon: "click", description: "Five variants and sizes, one source of truth.", height: 220 },
  badge: { title: "Badge", group: "primitives", icon: "tag", description: "Filled, tinted and outlined labels.", height: 200 },
  "form-controls": { title: "Form controls", group: "primitives", icon: "form", description: "Input, switch, checkbox and progress on the same tokens.", height: 380 },
  card: { title: "Card", group: "primitives", icon: "square", description: "A surface with a header, content and footer.", height: 300 },
  tabs: { title: "Tabs", group: "primitives", icon: "tabs", description: "Tabs with a sliding indicator.", height: 260 },
  dialog: { title: "Dialog", group: "primitives", icon: "dialog", description: "A modal with a header, fields and a footer.", height: 240 },
  select: { title: "Select", group: "primitives", icon: "select", description: "A themed menu with grouped options.", height: 240 },
  accordion: { title: "Accordion", group: "primitives", icon: "accordion", description: "Stacked sections that open one at a time.", height: 320 },
  avatar: { title: "Avatar", group: "primitives", icon: "avataricon", description: "Initials that stand in for photos.", height: 200 },
  marquee: { title: "Marquee", group: "effects", icon: "move", description: "An endless ticker that pauses on hover.", height: 200 },
  "border-beam": { title: "Border beam", group: "effects", icon: "sparkles", description: "A light that travels around a card's edge.", height: 240 },
  "text-effect": { title: "Text effect", group: "effects", icon: "type", description: "Words that fade in one after another.", height: 200 },
  spotlight: { title: "Spotlight", group: "effects", icon: "spotlight", description: "A soft beam that sweeps in on mount.", height: 220 },
  "theme-toggle": { title: "Theme toggle", group: "effects", icon: "click", description: "A sun, moon and monitor button that wipes the new theme out from the click.", height: 200 },
  "image-comparison": { title: "Image comparison", group: "effects", icon: "compare", description: "A wipe handle between before and after.", height: 300 },
  "animated-beam": { title: "Animated beam", group: "effects", icon: "beam", description: "A gradient pulse that runs between two nodes.", height: 220 },
  "animated-group": { title: "Animated group", group: "effects", icon: "animate", description: "Staggered entrances with one replay button.", height: 220 },
  "image-reveal": { title: "Image reveal", group: "effects", icon: "reveal", description: "Photos that dissolve in through a pixel pass.", height: 340 },
  "kanban-board": { title: "Kanban board", group: "tasks", icon: "kanban", description: "Drag cards between lanes, by mouse or by keyboard.", height: 440 },
  "task-list": { title: "Task list", group: "tasks", icon: "list", description: "Rows grouped by status that fold, with drag between groups.", height: 440 },
  "task-gantt": { title: "Gantt", group: "tasks", icon: "gantt", description: "Bars you drag and resize by the day, with arrows between tasks.", height: 440 },
  "status-badge": { title: "Status badge", group: "tasks", icon: "tag", description: "Chips from one status config, with a busy spinner.", height: 200 },
  "status-dot": { title: "Status dot", group: "tasks", icon: "dot", description: "Dots in five shapes, from open ring to filled check.", height: 260 },
  "status-icon": { title: "Status icon", group: "tasks", icon: "statusicon", description: "Registry icons with a dot fallback for the rest.", height: 220 },
  "agent-avatar": { title: "Agent avatar", group: "ai", icon: "avatar", description: "A bot face from a seed, eleven shapes and hats.", height: 260 },
  "agent-cast": { title: "Agent cast", group: "ai", icon: "cast", description: "The full cast on one card, ready to pick.", height: 300 },
  "slide-deck": { title: "Slide deck", group: "pages", icon: "deck", description: "A deck with reveals, overview and print, on a canvas that scales.", height: 380 },
  "ai-prompt": { title: "Prompt input", group: "ai", icon: "prompt", description: "Ask box with suggestions and send states.", height: 300 },
  "ai-conversation": { title: "Conversation", group: "ai", icon: "conversation", description: "Chat bubbles with a markdown answer.", height: 380 },
  "ai-thinking": { title: "Thinking dots", group: "ai", icon: "thinking", description: "Three dots while the answer forms.", height: 200 },
  "chat-composer": { title: "Composer", group: "ai", icon: "composer", description: "Message box with send on Enter.", height: 300 },
  "chat-typing": { title: "Typing dots", group: "ai", icon: "typing", description: "Who is typing, in three dots.", height: 200 },
  "trade-icon": { title: "Trade icon", group: "primitives", icon: "tradeicon", description: "One glyph per trade, same stroke.", height: 240 },
  "brand-tokens": { title: "Brand tokens", group: "pages", icon: "brand", description: "The palette as swatches, one source.", height: 240 },
  "testimonial-highlight": { title: "Testimonial", group: "pages", icon: "testimonial", description: "One featured quote, ready to place.", height: 360 },
  "review-page": { title: "Review page", group: "pages", icon: "reviewpage", description: "The full review UI mounted in a box.", height: 420 },
};

const components = import.meta.glob<{ default: Component }>("./demos/*.svelte", { eager: true });
const sources = import.meta.glob<string>("./demos/*.svelte", { eager: true, query: "?raw", import: "default" });

/** `packages/<pkg>/src/...`, except the agents, which ship inside ui but get their own section. */
const packageOf = (slug: string) => {
  const file = componentSources[slug]?.[0] ?? "";
  if (file.startsWith("packages/ui/src/agents/")) return "agents";
  return file.split("/")[1] ?? "ui";
};

export const entries: Entry[] = Object.keys(meta).map((slug) => {
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
  { id: "review", name: "@heyramzi/review", title: "Review", blurb: "The review page, mounted anywhere." },
];

export const packageById = (id: string) => packages.find((p) => p.id === id)!;

export const groupLabel = (id: Group) => groups.find((g) => g.id === id)?.label ?? id;

export const bySlug = (slug: string) => entries.find((e) => e.slug === slug);
