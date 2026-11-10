// A pen node's accessible name. Svelte Flow puts `ariaLabel` on the focusable node wrapper,
// so the name has to live on the node object and follow its words as they're edited.

import { useSvelteFlow } from "@xyflow/svelte";
import { untrack } from "svelte";

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** "Idea" for a text, "Rectangle: Idea" for a labelled shape, "Pen stroke" for a drawing. */
export function penNodeName(
  kind: "text" | "shape" | "stroke",
  data: { text?: string; label?: string; shape?: string; tool?: string },
): string {
  if (kind === "text") return data.text?.trim() || "Empty text";
  if (kind === "stroke") return `${cap(data.tool ?? "pen")} stroke`;
  const shape = cap(data.shape ?? "shape");
  const label = data.label?.trim();
  return label ? `${shape}: ${label}` : shape;
}

/** Keeps node `id`'s ariaLabel equal to `name()`. Call it from a node component. */
export function useNodeName(id: () => string, name: () => string): void {
  const { getNode, updateNode } = useSvelteFlow();
  $effect(() => {
    const nodeId = id();
    const label = name();
    // untrack: updateNode reads the node list, and tracking it would rerun this on every write.
    untrack(() => {
      if (getNode(nodeId)?.ariaLabel !== label) updateNode(nodeId, { ariaLabel: label });
    });
  });
}
