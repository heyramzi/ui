// The browser registers `screenUiPlugin`, and a server registers `screenPlugin`.
// Never both, because a kind has one owner.

import { definePlugin } from "#src/canvas/plugin.js";
import { screenKind, screenPlugin } from "#src/canvas/screen/plugin.js";
import ScreenCard from "#src/canvas/screen/ScreenCard.svelte";

export { ScreenCard };

export const screenUiPlugin = definePlugin({
  ...screenPlugin,
  nodes: [{ ...screenKind, component: ScreenCard }],
});
