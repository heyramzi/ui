import type { Component } from "svelte";

export type Icon = "area"|"line"|"bar"|"pie"|"ring"|"gauge"|"activity"|"dashboard"|"hash"|"spline"|"click"|"tag"|"form"|"square"|"tabs"|"move"|"sparkles"|"type"|"kanban"|"list"|"gantt"|"dot"|"statusicon"|"avatar"|"cast"|"deck"|"spotlight"|"compare"|"beam"|"animate"|"reveal"|"dialog"|"accordion"|"select"|"avataricon"|"prompt"|"conversation"|"thinking"|"composer"|"typing"|"tradeicon"|"brand"|"testimonial"|"reviewpage";

export type Group = "charts" | "primitives" | "components" | "effects" | "tasks" | "agents" | "slides" | "marketing" | "review";

export type Entry = {
  slug: string;
  title: string;
  group: Group;
  icon: Icon;
  description: string;
  /** Preview canvas minimum height, px. */
  height?: number;
  component: Component;
  source: string;
  /** Repo-relative paths of the component source file(s) behind this demo, for "Copy for AI". */
  sourceFiles: string[];
};

/** Where each demo's component lives. Several paths list the main component first. */
const componentSources: Record<string, string[]> = {
  "area-chart": ["packages/ui/src/charts/area-chart.svelte"],
  "line-chart": ["packages/ui/src/charts/line-chart.svelte"],
  "bar-chart": ["packages/ui/src/charts/bar-chart.svelte"],
  "donut-chart": ["packages/ui/src/charts/donut-chart.svelte"],
  "ring-chart": ["packages/ui/src/charts/ring-chart.svelte"],
  "gauge-chart": ["packages/ui/src/charts/gauge-chart.svelte"],
  sparkline: ["packages/ui/src/charts/sparkline.svelte"],
  "stat-card": ["packages/ui/src/charts/stat-card.svelte"],
  "number-chart": ["packages/ui/src/charts/number-chart.svelte"],
  "time-series-chart": ["packages/ui/src/charts/time-series-chart.svelte"],
  button: ["packages/ui/src/shadcn/button/button.svelte"],
  badge: ["packages/ui/src/shadcn/badge/badge.svelte"],
  "form-controls": [
    "packages/ui/src/shadcn/input/input.svelte",
    "packages/ui/src/shadcn/switch/switch.svelte",
    "packages/ui/src/shadcn/checkbox/checkbox.svelte",
    "packages/ui/src/shadcn/progress/progress.svelte",
  ],
  card: ["packages/ui/src/shadcn/card/card.svelte"],
  tabs: ["packages/ui/src/shadcn/tabs/tabs.svelte"],
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
  "slide-deck": ["packages/slides/src/Deck.svelte", "packages/slides/src/Slide.svelte"],
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

const meta: Record<string, Omit<Entry, "slug" | "component" | "source" | "sourceFiles">> = {
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
  "agent-avatar": { title: "Agent avatar", group: "agents", icon: "avatar", description: "A bot face from a seed, eleven shapes and hats.", height: 260 },
  "agent-cast": { title: "Agent cast", group: "agents", icon: "cast", description: "The full cast on one card, ready to pick.", height: 300 },
  "slide-deck": { title: "Slide deck", group: "slides", icon: "deck", description: "Keyboard and swipe decks that print.", height: 380 },
  "ai-prompt": { title: "Prompt input", group: "components", icon: "prompt", description: "Ask box with suggestions and send states.", height: 300 },
  "ai-conversation": { title: "Conversation", group: "components", icon: "conversation", description: "Chat bubbles with a markdown answer.", height: 380 },
  "ai-thinking": { title: "Thinking dots", group: "components", icon: "thinking", description: "Three dots while the answer forms.", height: 200 },
  "chat-composer": { title: "Composer", group: "components", icon: "composer", description: "Message box with send on Enter.", height: 300 },
  "chat-typing": { title: "Typing dots", group: "components", icon: "typing", description: "Who is typing, in three dots.", height: 200 },
  "trade-icon": { title: "Trade icon", group: "components", icon: "tradeicon", description: "One glyph per trade, same stroke.", height: 240 },
  "brand-tokens": { title: "Brand tokens", group: "marketing", icon: "brand", description: "The palette as swatches, one source.", height: 240 },
  "testimonial-highlight": { title: "Testimonial", group: "marketing", icon: "testimonial", description: "One featured quote, ready to place.", height: 360 },
  "review-page": { title: "Review page", group: "review", icon: "reviewpage", description: "The full review UI mounted in a box.", height: 420 },
};

const components = import.meta.glob<{ default: Component }>("./demos/*.svelte", { eager: true });
const sources = import.meta.glob<string>("./demos/*.svelte", { eager: true, query: "?raw", import: "default" });

export const entries: Entry[] = Object.keys(meta).map((slug) => {
  const path = `./demos/${slug}.svelte`;
  return {
    slug,
    ...meta[slug],
    component: components[path].default,
    source: sources[path].trim(),
    sourceFiles: componentSources[slug] ?? [],
  };
});

export const groups: { id: Group; label: string }[] = [
  { id: "charts", label: "Charts" },
  { id: "primitives", label: "Primitives" },
  { id: "components", label: "Components" },
  { id: "effects", label: "Effects" },
  { id: "tasks", label: "Tasks" },
  { id: "agents", label: "Agents" },
  { id: "slides", label: "Slides" },
  { id: "marketing", label: "Marketing" },
  { id: "review", label: "Review" },
];

export const packages: { id: string; name: string; blurb: string; groups: Group[] }[] = [
  { id: "ui", name: "@heyramzi/ui", blurb: "Charts, primitives, components and effects.", groups: ["charts", "primitives", "components", "effects"] },
  { id: "agents", name: "@heyramzi/ui/agents", blurb: "Bot avatars and a cast page.", groups: ["agents"] },
  { id: "tasks", name: "@heyramzi/tasks", blurb: "Board, list and gantt views from one config, plus status chips, dots and icons.", groups: ["tasks"] },
  { id: "slides", name: "@heyramzi/slides", blurb: "Keyboard and swipe decks that print.", groups: ["slides"] },
  { id: "marketing", name: "@heyramzi/marketing", blurb: "Brand tokens and testimonial surfaces.", groups: ["marketing"] },
  { id: "review", name: "@heyramzi/review", blurb: "The review page, mounted anywhere.", groups: ["review"] },
];

export const bySlug = (slug: string) => entries.find((e) => e.slug === slug);
