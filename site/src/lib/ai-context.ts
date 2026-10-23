import type { Entry } from "#lib/registry.js";

/**
 * Lazy component sources, listed to match `componentSources` one to one because
 * `import.meta.glob` only takes static patterns; keys are relative to this file.
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
    "../../../packages/ui/src/charts/legend.svelte",
    "../../../packages/ui/src/charts/dashboard/dashboard-section.svelte",
    "../../../packages/ui/src/charts/dashboard/stat-band.svelte",
    "../../../packages/ui/src/charts/dashboard/stat-tile.svelte",
    "../../../packages/ui/src/charts/dashboard/panel-grid.svelte",
    "../../../packages/ui/src/charts/dashboard/data-panel.svelte",
    "../../../packages/ui/src/charts/dashboard/period-filter.svelte",
    "../../../packages/ui/src/shadcn/button/button.svelte",
    "../../../packages/ui/src/shadcn/badge/badge.svelte",
    "../../../packages/ui/src/shadcn/card/card.svelte",
    "../../../packages/ui/src/shadcn/tabs/tabs-list.svelte",
    "../../../packages/ui/src/lib/sliding-pill.ts",
    "../../../packages/ui/src/components/segmented/animated-tabs.svelte",
    "../../../packages/ui/src/components/segmented/segmented-filter.svelte",
    "../../../packages/ui/src/components/segmented/segmented-track.svelte",
    "../../../packages/ui/src/components/picker/picker.svelte",
    "../../../packages/ui/src/components/toolbar/toolbar.svelte",
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
    "../../../packages/ui/src/work/kanban-board.svelte",
    "../../../packages/ui/src/work/task-list.svelte",
    "../../../packages/ui/src/work/task-gantt.svelte",
    "../../../packages/ui/src/status/status-badge.svelte",
    "../../../packages/ui/src/status/status-dot.svelte",
    "../../../packages/ui/src/status/status-icon.svelte",
    "../../../packages/ui/src/agents/agent-avatar.svelte",
    "../../../packages/ui/src/agents/agent-cast.svelte",
    "../../../packages/ui/src/slides/Deck.svelte",
    "../../../packages/ui/src/slides/Slide.svelte",
    "../../../packages/ui/src/ai/prompt-input/PromptInput.svelte",
    "../../../packages/ui/src/ai/response/Response.svelte",
    "../../../packages/ui/src/ai/thinking-dots/ThinkingDots.svelte",
    "../../../packages/ui/src/ai/typing-dots/TypingDots.svelte",
    "../../../packages/ui/src/icons/TradeIcon.svelte",
    "../../../packages/ui/src/tokens/palette.css",
    "../../../packages/ui/src/brand/index.ts",
    "../../../packages/ui/src/icons/sf-symbols.ts",
    "../../../packages/ui/src/components/language-flag/language-flag.svelte",
    "../../../packages/ui/src/components/mark/mark.svelte",
    "../../../packages/ui/src/components/data-table/data-table.ts",
    "../../../packages/ui/src/components/data-table/sortable-head.svelte",
    "../../../packages/ui/src/components/data-table/pagination.svelte",
    "../../../packages/ui/src/components/data-table/table-skeleton.svelte",
    "../../../packages/ui/src/components/data-table/row-arrow.svelte",
    "../../../packages/ui/src/components/star-rating-input/star-rating-input.svelte",
    "../../../packages/ui/src/components/locale-switch/locale-switch.svelte",
    "../../../packages/ui/src/effects/shader-gradient/ShaderGradient.svelte",
    "../../../packages/ui/src/effects/interactive-hover-button/InteractiveHoverButton.svelte",
    "../../../packages/ui/src/ai/suggestion/Suggestion.svelte",
    "../../../packages/ui/src/ai/suggestion/Suggestions.svelte",
    "../../../packages/ui/src/ai/ai-button/AiButton.svelte",
    "../../../packages/ui/src/ai/generation-progress/GenerationProgress.svelte",
    "../../../packages/ui/src/editor/inline-editor.svelte",
    "../../../packages/ui/src/components/list-page/list-page-shell.svelte",
    "../../../packages/ui/src/components/list-page/master-detail.svelte",
    "../../../packages/ui/src/components/list-page/rail-row.svelte",
    "../../../packages/ui/src/components/list-page/detail-header.svelte",
    "../../../packages/ui/src/components/list-page/detail-panel.svelte",
    "../../../packages/ui/src/components/toolbar/toolbar-search.svelte",
    "../../../packages/ui/src/components/icon/icon.svelte",
    "../../../packages/ui/src/components/svg/svg.svelte",
    "../../../packages/ui/src/panel/side-panel.svelte",
    "../../../packages/ui/src/editor/editor.svelte",
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
  if (components.length)
    parts.push("", "## Component source", "", ...components.join("\n\n").split("\n"));

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
