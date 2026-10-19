import type { Entry } from "#lib/registry.js";

/**
 * Component sources, loaded lazily so they never land in the home page bundle.
 * The list matches `componentSources` in component-sources.ts one to one; it is spelled
 * out here because `import.meta.glob` only takes statically analysable patterns.
 * Keys are relative to this file, which is why they start with `../../../`.
 */
const sources = import.meta.glob(
  [
    "../../../packages/charts/src/area-chart.svelte",
    "../../../packages/charts/src/line-chart.svelte",
    "../../../packages/charts/src/bar-chart.svelte",
    "../../../packages/charts/src/donut-chart.svelte",
    "../../../packages/charts/src/ring-chart.svelte",
    "../../../packages/charts/src/gauge-chart.svelte",
    "../../../packages/charts/src/sparkline.svelte",
    "../../../packages/charts/src/stat-card.svelte",
    "../../../packages/charts/src/number-chart.svelte",
    "../../../packages/charts/src/time-series-chart.svelte",
    "../../../packages/charts/src/legend.svelte",
    "../../../packages/charts/src/dashboard/dashboard-section.svelte",
    "../../../packages/charts/src/dashboard/stat-band.svelte",
    "../../../packages/charts/src/dashboard/stat-tile.svelte",
    "../../../packages/charts/src/dashboard/panel-grid.svelte",
    "../../../packages/charts/src/dashboard/data-panel.svelte",
    "../../../packages/charts/src/dashboard/period-filter.svelte",
    "../../../packages/ui/src/shadcn/button/button.svelte",
    "../../../packages/ui/src/shadcn/badge/badge.svelte",
    "../../../packages/ui/src/shadcn/input/input.svelte",
    "../../../packages/ui/src/shadcn/switch/switch.svelte",
    "../../../packages/ui/src/shadcn/checkbox/checkbox.svelte",
    "../../../packages/ui/src/shadcn/progress/progress.svelte",
    "../../../packages/ui/src/shadcn/card/card.svelte",
    "../../../packages/ui/src/shadcn/tabs/tabs-list.svelte",
    "../../../packages/ui/src/lib/sliding-pill.ts",
    "../../../packages/ui/src/components/segmented/animated-tabs.svelte",
    "../../../packages/ui/src/components/segmented/segmented-filter.svelte",
    "../../../packages/ui/src/components/segmented/segmented-track.svelte",
    "../../../packages/ui/src/components/picker/picker.svelte",
    "../../../packages/ui/src/components/copy/copy-button.svelte",
    "../../../packages/ui/src/components/hold-to-confirm/hold-to-confirm.svelte",
    "../../../packages/ui/src/shadcn/field/simple-field.svelte",
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
    "../../../packages/tasks/src/kanban-board.svelte",
    "../../../packages/tasks/src/task-list.svelte",
    "../../../packages/tasks/src/task-gantt.svelte",
    "../../../packages/tasks/src/status-badge.svelte",
    "../../../packages/tasks/src/status-dot.svelte",
    "../../../packages/tasks/src/status-icon.svelte",
    "../../../packages/ui/src/agents/agent-avatar.svelte",
    "../../../packages/ui/src/agents/agent-cast.svelte",
    "../../../packages/slides/src/Deck.svelte",
    "../../../packages/slides/src/Slide.svelte",
    "../../../packages/ui/src/ai/prompt-input/PromptInput.svelte",
    "../../../packages/ui/src/ai/response/Response.svelte",
    "../../../packages/ui/src/ai/thinking-dots/ThinkingDots.svelte",
    "../../../packages/ui/src/ai/typing-dots/TypingDots.svelte",
    "../../../packages/ui/src/icons/TradeIcon.svelte",
    "../../../packages/marketing/src/brand/index.ts",
    "../../../packages/marketing/src/testimonials/svelte/TestimonialHighlight.svelte",
    "../../../packages/review/src/mount.ts",
    "../../../packages/tasks/src/side-panel.svelte",
    "../../../packages/rich-editor/src/editor.svelte",
    "../../../packages/ui/src/effects/reveal/InView.svelte",
    "../../../packages/ui/src/effects/magnetic/magnetic.ts",
    "../../../packages/ui/src/effects/progressive-blur/ProgressiveBlur.svelte",
    "../../../packages/ui/src/ai/confirmation/Confirmation.svelte",
    "../../../packages/ui/src/ai/loading-state/PixelLoader.svelte",
    "../../../packages/ui/src/ai/reasoning/Reasoning.svelte",
    "../../../packages/ui/src/ai/voice-waveform/VoiceWaveform.svelte",
    "../../../packages/ui/src/animations/text-swap.ts",
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
