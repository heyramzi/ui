// A pen node's accessible name. Svelte Flow puts `ariaLabel` on the focusable node wrapper,
// so the name has to live on the node object and follow its words as they're edited.

import { useStore } from "@xyflow/svelte";
import { untrack } from "svelte";

type FlowStore = ReturnType<typeof useStore>;

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

// One write per canvas per tick: a write per node redrew the whole board once for each, 473 times opening 1,000 cards.
const pending = new WeakMap<FlowStore, Map<string, string>>();

function queueName(store: FlowStore, nodeId: string, label: string): void {
  let names = pending.get(store);
  if (!names) {
    const queued = new Map<string, string>();
    names = queued;
    pending.set(store, queued);
    queueMicrotask(() => {
      pending.delete(store);
      let changed = false;
      const nodes = store.nodes.map((node) => {
        const name = queued.get(node.id);
        if (name === undefined || node.ariaLabel === name) return node;
        changed = true;
        return { ...node, ariaLabel: name };
      });
      if (changed) store.nodes = nodes;
    });
  }
  names.set(nodeId, label);
}

/** Keeps node `id`'s ariaLabel equal to `name()`. Call it from a node component. */
export function useNodeName(id: () => string, name: () => string): void {
  const store = useStore();
  $effect(() => {
    const nodeId = id();
    const label = name();
    // untrack: the write reads the node list, and tracking it would rerun this on every write.
    untrack(() => queueName(store, nodeId, label));
  });
}
