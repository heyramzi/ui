/*
 * Unlayered CSS beats every layer, so one kit rule outside `@layer components` silently beats a caller's utility class.
 * Design: ui-3.0 plan, section 1.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseCss } from "svelte/compiler";
import type { AST } from "svelte/compiler";
import { describe, expect, it } from "vite-plus/test";

const src = dirname(fileURLToPath(import.meta.url));

const ORDER = "theme, base, components, utilities";

/** Top-level at-rules that hold no style rules of their own, or that Tailwind and Svelte need at the top. */
const TOP_LEVEL_AT_RULES = new Set([
  "layer",
  "keyframes",
  "-webkit-keyframes",
  "property",
  "theme",
  "utility",
  "custom-variant",
  "import",
  "source",
  "font-face",
]);

/** Kit stylesheets that keep top-level rules, and why. */
const UNLAYERED_FILES: Record<string, string> = {
  "tokens/palette.css": "token blocks that agency-os and upsys scripts read by top-level selector",
  "tokens/craft.css": "token blocks that agency-os and upsys scripts read by top-level selector",
  "tokens/primitives.css": "reached only through tokens/index.css, which declares the order",
  "shadcn/utilities.css": "its reduced-motion `.shimmer` rule has to beat the `shimmer` utility",
};

/** Components whose `<style>` block isn't layered yet. Phase 2 of the 3.0 plan empties this list. */
const PENDING_STYLE_BLOCKS = new Set([
  "agents/agent-cast.svelte",
  "ai/generation-progress/GenerationProgress.svelte",
  "ai/loading-state/PixelLoader.svelte",
  "canvas/chrome/snap-guides.svelte",
  "canvas/components/shared/svg/PreviewSvg.svelte",
  "canvas/components/shared/svg/ShapeOutline.svelte",
  "canvas/components/shared/svg/StrokeNode.svelte",
  "canvas/components/shared/svg/TextRule.svelte",
  "canvas/edges/bend-handle.svelte",
  "canvas/lod/lod-switch.svelte",
  "canvas/pen/PenOverlay.svelte",
  "canvas/pen/TextNode.svelte",
  "canvas/ui/FrameLayer.svelte",
  "canvas/ui/StylePanel.svelte",
  "charts/dashboard/stat-tile.svelte",
  "components/docs/on-this-page.svelte",
  "components/hold-to-confirm/hold-to-confirm.svelte",
  "components/list-page/empty-state.svelte",
  "components/list-page/master-detail.svelte",
  "components/segmented/segmented-track.svelte",
  "components/star-rating-input/star-rating-input.svelte",
  "editor/editor-toolbar.svelte",
  "editor/editor.svelte",
  "editor/image-toolbar.svelte",
  "editor/slash-menu.svelte",
  "effects/interactive-hover-button/InteractiveHoverButton.svelte",
  "onboarding/tour-runner.svelte",
  "shadcn/table/table-cell.svelte",
  "slides/Controls.svelte",
  "slides/Deck.svelte",
  "slides/Fragment.svelte",
  "slides/Overview.svelte",
  "slides/Presenter.svelte",
  "slides/Slide.svelte",
  "status/status-dot.svelte",
  "work/docs/doc-editor-page.svelte",
  "work/gantt/gantt-bar.svelte",
  "work/gantt/gantt-grid.svelte",
  "work/gantt/gantt-group-row.svelte",
  "work/gantt/gantt-task-row.svelte",
  "work/kanban-board.svelte",
  "work/kanban-column.svelte",
  "work/kanban-fold-chevron.svelte",
  "work/kanban-hidden-rail.svelte",
  "work/task-list.svelte",
  "work/time/time-dot.svelte",
  "work/time/time-ring.svelte",
  "work/time/time-tracker.svelte",
]);

function files(dir: string, ext: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path, ext);
    return entry.name.endsWith(ext) ? [path] : [];
  });
}

type Node = AST.CSS.Rule | AST.CSS.Atrule;

function rules(node: Node): AST.CSS.Rule[] {
  if (node.type === "Rule") return [node];
  return (node.block?.children ?? []).flatMap((child) =>
    child.type === "Declaration" ? [] : rules(child),
  );
}

/** xyflow's own stylesheet is unlayered, so a canvas rule on its parts stays unlayered to keep winning. */
function overridesXyflow(file: string, css: string, node: Node): boolean {
  if (!file.startsWith("canvas/")) return false;
  const all = rules(node);
  return (
    all.length > 0 &&
    all.every((rule) => css.slice(rule.prelude.start, rule.prelude.end).includes("svelte-flow"))
  );
}

/** Every reason this stylesheet's top level lets a rule escape the components layer. */
function violations(file: string, css: string): string[] {
  const nodes = parseCss(css).children;
  const found: string[] = [];
  const line = (node: Node) => `${file}:${css.slice(0, node.start).split("\n").length}`;

  for (const node of nodes) {
    if (overridesXyflow(file, css, node)) continue;
    if (node.type === "Rule") {
      found.push(`${line(node)} rule outside a layer`);
    } else if (!TOP_LEVEL_AT_RULES.has(node.name)) {
      const reducedMotion =
        file === "tokens/base.css" && node.prelude.includes("prefers-reduced-motion");
      if (!reducedMotion) found.push(`${line(node)} @${node.name} outside a layer`);
    }
  }

  const layered = nodes.some(
    (node) => node.type === "Atrule" && node.name === "layer" && node.block,
  );
  const first = nodes[0];
  const declaresOrder =
    first?.type === "Atrule" &&
    first.name === "layer" &&
    !first.block &&
    first.prelude.replace(/\s+/g, " ").trim() === ORDER;
  if (layered && !declaresOrder)
    found.push(`${file} has a layer block but doesn't open with @layer ${ORDER};`);
  return found;
}

function styleBlock(path: string): string | null {
  return parse(readFileSync(path, "utf8"), { modern: true }).css?.content.styles ?? null;
}

describe("kit CSS sits in the components layer", () => {
  it("in every stylesheet", () => {
    const found = files(src, ".css").flatMap((path) => {
      const file = relative(src, path);
      return file in UNLAYERED_FILES ? [] : violations(file, readFileSync(path, "utf8"));
    });
    expect(found).toEqual([]);
  });

  it("in every component style block", () => {
    const found = files(src, ".svelte").flatMap((path) => {
      const file = relative(src, path);
      const css = styleBlock(path);
      if (css === null || PENDING_STYLE_BLOCKS.has(file)) return [];
      return violations(file, css);
    });
    expect(found).toEqual([]);
  });

  it("with no pending component that is already layered", () => {
    const done = files(src, ".svelte").flatMap((path) => {
      const file = relative(src, path);
      if (!PENDING_STYLE_BLOCKS.has(file)) return [];
      const css = styleBlock(path);
      return css !== null && violations(file, css).length === 0 ? [file] : [];
    });
    expect(done, "layered now: remove these from PENDING_STYLE_BLOCKS").toEqual([]);
  });
});
