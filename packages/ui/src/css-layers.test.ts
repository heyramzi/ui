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

/** Component rules that stay unlayered because a utility on the same element would beat them, and why. */
const UNLAYERED_RULES: Record<string, string> = {
  "work/kanban-hidden-rail.svelte .kanban-rail-item-leaving":
    "the row's `transition-[background-color,outline-color]` utility would drop the fade out",
  "work/time/time-tracker.svelte .time-chip.is-running :global(.time-open)":
    "the ghost button's `hover:text-foreground` would drop the running accent",
};

function keptUnlayered(file: string, css: string, node: Node): boolean {
  const all = rules(node);
  return (
    all.length > 0 &&
    all.every(
      (rule) =>
        `${file} ${css.slice(rule.prelude.start, rule.prelude.end).trim()}` in UNLAYERED_RULES,
    )
  );
}

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
    if (overridesXyflow(file, css, node) || keptUnlayered(file, css, node)) continue;
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
      if (css === null) return [];
      return violations(file, css);
    });
    expect(found).toEqual([]);
  });
});
