import type { NodeComponents } from "../render/contract";

export { default as NodeHost } from "./NodeHost.svelte";

/** Type a components map for `<Draw nodes={...}>` and keep it unchanged. */
export function defineNodes(map: NodeComponents): NodeComponents {
  return map;
}
