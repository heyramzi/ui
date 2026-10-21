// @heyramzi/ui/canvas public API. Server-safe: nothing here touches the DOM.
// Svelte components are imported by path, like "@heyramzi/ui/canvas/ui/canvas-grid.svelte".

export * from "#src/canvas/types.js";
export * from "#src/canvas/plugin.js";
export { tryCatch, tryCatchAsync, type Result } from "#src/lib/result.js";

export * from "#src/canvas/ops/ops.js";

export * from "#src/canvas/headless/alignment.js";
export * from "#src/canvas/headless/canvas-cleanup.js";
export * from "#src/canvas/headless/edge-anchors.js";
export * from "#src/canvas/headless/edge-serialization.js";
export * from "#src/canvas/headless/fit-viewport.js";
export * from "#src/canvas/headless/grid.js";
export * from "#src/canvas/headless/icon-node.js";
export * from "#src/canvas/headless/linkify.js";
export * from "#src/canvas/headless/sketch.js";
export * from "#src/canvas/headless/snap-guides.js";
export * from "#src/canvas/headless/svg-figure.js";
export * from "#src/canvas/headless/table-layout.js";

export {
  resolveContextMenuHit,
  type ContextMenuHit,
  type TableCellHit,
} from "#src/canvas/editor/context-menu.js";
export * from "#src/canvas/editor/editor-context.js";
export * from "#src/canvas/editor/dispatch.svelte.js";
export * from "#src/canvas/editor/editor-mode.js";
export * from "#src/canvas/editor/history-core.js";
export * from "#src/canvas/editor/keymap.js";
export * from "#src/canvas/editor/layout-actions.js";
export * from "#src/canvas/editor/rebase.js";
export * from "#src/canvas/editor/text-field-context.js";
