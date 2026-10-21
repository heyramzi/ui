// The browser registers `penUiPlugin`, and a server registers `penPlugin`.
// Never both, because a kind has one owner.

import { definePlugin } from "#src/canvas/plugin.js";
import PenOverlay from "#src/canvas/pen/PenOverlay.svelte";
import { penPlugin } from "#src/canvas/pen/plugin.js";
import ShapeNode from "#src/canvas/pen/ShapeNode.svelte";
import StrokeNode from "#src/canvas/components/shared/svg/StrokeNode.svelte";
import TextNode from "#src/canvas/pen/TextNode.svelte";
import { SHAPE_NODE, STROKE_NODE, TEXT_NODE } from "#src/canvas/pen/types.js";

export { PenOverlay, ShapeNode, StrokeNode, TextNode };

const components = {
  [STROKE_NODE]: StrokeNode,
  [TEXT_NODE]: TextNode,
  [SHAPE_NODE]: ShapeNode,
};

export const penUiPlugin = definePlugin({
  ...penPlugin,
  nodes: (penPlugin.nodes ?? []).map((kind) => ({
    ...kind,
    component: components[kind.type as keyof typeof components],
  })),
});
