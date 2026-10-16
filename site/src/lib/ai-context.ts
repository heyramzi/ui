import type { Entry } from "#lib/registry.js";

/**
 * Component sources, loaded lazily so they never land in the home page bundle.
 * The list matches `componentSources` in the registry one to one; it is spelled
 * out here because `import.meta.glob` only takes statically analysable patterns.
 * Keys are relative to this file, which is why they start with `../../../`.
 */
const sources = import.meta.glob(
  [
    "../../../packages/ui/src/charts/area-chart.svelte",
    "../../../packages/ui/src/charts/line-chart.svelte",
    "../../../packages/ui/src/charts/bar-chart.svelte",
    "../../../packages/ui/src/charts/donut-chart.svelte",
    "../../../packages/ui/src/charts/ring-chart.svelte",
    "../../../packages/ui/src/charts/gauge-chart.svelte",
    "../../../packages/ui/src/charts/sparkline.svelte",
    "../../../packages/ui/src/charts/stat-card.svelte",
    "../../../packages/ui/src/charts/number-chart.svelte",
    "../../../packages/ui/src/charts/time-series-chart.svelte",
    "../../../packages/ui/src/shadcn/button/button.svelte",
    "../../../packages/ui/src/shadcn/badge/badge.svelte",
    "../../../packages/ui/src/shadcn/input/input.svelte",
    "../../../packages/ui/src/shadcn/switch/switch.svelte",
    "../../../packages/ui/src/shadcn/checkbox/checkbox.svelte",
    "../../../packages/ui/src/shadcn/progress/progress.svelte",
    "../../../packages/ui/src/shadcn/card/card.svelte",
    "../../../packages/ui/src/shadcn/tabs/tabs.svelte",
    "../../../packages/ui/src/shadcn/dialog/dialog.svelte",
    "../../../packages/ui/src/shadcn/dialog/dialog-content.svelte",
    "../../../packages/ui/src/shadcn/select/select.svelte",
    "../../../packages/ui/src/shadcn/accordion/accordion.svelte",
    "../../../packages/ui/src/shadcn/avatar/avatar.svelte",
    "../../../packages/ui/src/effects/marquee/Marquee.svelte",
    "../../../packages/ui/src/effects/border-beam/BorderBeam.svelte",
    "../../../packages/ui/src/effects/reveal/TextEffect.svelte",
    "../../../packages/ui/src/effects/spotlight/Spotlight.svelte",
    "../../../packages/ui/src/effects/theme-toggle/ThemeToggle.svelte",
    "../../../packages/ui/src/lib/theme-transition.ts",
    "../../../packages/ui/src/effects/image-comparison/ImageComparison.svelte",
    "../../../packages/ui/src/effects/animated-beam/AnimatedBeam.svelte",
    "../../../packages/ui/src/effects/reveal/AnimatedGroup.svelte",
    "../../../packages/ui/src/effects/image-reveal/ImageReveal.svelte",
    "../../../packages/board/src/kanban-board.svelte",
    "../../../packages/board/src/status-badge.svelte",
    "../../../packages/board/src/status-dot.svelte",
    "../../../packages/board/src/status-icon.svelte",
    "../../../packages/agents/src/agent-avatar.svelte",
    "../../../packages/agents/src/agent-cast.svelte",
    "../../../packages/slides/src/Deck.svelte",
    "../../../packages/slides/src/Slide.svelte",
    "../../../packages/ui/src/ai/prompt-input/PromptInput.svelte",
    "../../../packages/ui/src/ai/conversation/Conversation.svelte",
    "../../../packages/ui/src/ai/response/Response.svelte",
    "../../../packages/ui/src/ai/thinking-dots/ThinkingDots.svelte",
    "../../../packages/ui/src/ai/composer/Composer.svelte",
    "../../../packages/ui/src/ai/typing-dots/TypingDots.svelte",
    "../../../packages/ui/src/icons/TradeIcon.svelte",
    "../../../packages/draw/src/Draw.svelte",
    "../../../packages/draw/src/Toolbar.svelte",
    "../../../packages/marketing/src/brand/index.ts",
    "../../../packages/marketing/src/testimonials/svelte/TestimonialHighlight.svelte",
    "../../../packages/review/src/mount.ts",
  ],
  { query: "?raw", import: "default" },
) as Record<string, () => Promise<string>>;

const keyFor = (path: string) => `../../../${path}`;

/** Every `@heyramzi/*` import statement in a demo, flattened to one line each. */
function packageImports(source: string): string[] {
  const statement = /import\s+[^;]*?from\s+["']@heyramzi\/[^"']+["'];?/g;
  return [...source.matchAll(statement)].map((m) => m[0].replace(/\s+/g, " ").trim());
}

/**
 * A Markdown block an AI agent can work from: the title and description, the
 * package and import line, the live demo source, and the component's own source.
 */
export async function buildAiContext(entry: Entry): Promise<string> {
  const imports = packageImports(entry.source);
  const pkg = imports[0]?.match(/@heyramzi\/[a-z-]+/)?.[0];

  const parts: string[] = [`# ${entry.title}`, "", entry.description];

  if (pkg) parts.push("", `Package: \`${pkg}\``);
  if (imports.length) parts.push("", "```ts", ...imports, "```");

  parts.push("", "## Usage", "", "```svelte", entry.source.trim(), "```");

  const components: string[] = [];
  for (const path of entry.sourceFiles) {
    const load = sources[keyFor(path)];
    if (!load) continue;
    const code = await load();
    components.push(`### ${path}`, "", "```svelte", code.trim(), "```");
  }
  if (components.length) parts.push("", "## Component source", "", ...components.join("\n\n").split("\n"));

  return parts.join("\n") + "\n";
}

/** Build the Markdown block and copy it. Returns false if the clipboard refuses. */
export async function copyAiContext(entry: Entry): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(await buildAiContext(entry));
    return true;
  } catch {
    return false;
  }
}
