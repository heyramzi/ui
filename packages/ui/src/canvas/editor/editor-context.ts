// Typed Svelte context between the editor and the node and edge components inside it,
// so every component edit lands on the dispatcher (undoable, autosaved).

// Components must tolerate a missing context: read-only hosts like a slide's embedded
// canvas provide none.

import { getContext, setContext } from "svelte";

export type DiagramEditorContext = {
  /** The canvas zoom, so a resize handle can stay one size on screen. */
  canvasZoom?: number;
  /**
   * Merge a partial data patch into a node. Undoable. With `coalesce`, patches to one node
   * less than a second apart are one undo step, for per-keystroke text.
   */
  patchNodeData: (
    nodeId: string,
    data: Record<string, unknown>,
    options?: { coalesce?: boolean },
  ) => void;
  /** End the coalescing text session so the next patch is a new undo step. Call it on blur. */
  endTextEdit: () => void;
  /** Set a node's width, keeping its style twin and its board slot in step.
   *  Undoable. */
  setNodeWidth: (nodeId: string, width: number) => void;
  /**
   * Open an undo transaction around a gesture and return its commit. A resize
   * writes the flow store itself, so open it before the first frame.
   */
  startGesture: () => () => void;
  /** Patch an edge (label, animated, type, style, handles). Undoable. */
  patchEdge: (edgeId: string, patch: Record<string, unknown>) => void;
  /** Remove one link. Undoable. */
  removeEdge: (edgeId: string) => void;
  /** Duplicate a node 50px down-right. Undoable. */
  duplicateNode: (nodeId: string) => void;
  /** Remove a node and its edges. Undoable. */
  removeNode: (nodeId: string) => void;
  /** Add a typed child under a container node. Undoable. */
  addChildNode: (parentId: string, type: string) => void;
  /**
   * Register the inline-edit entry point for a node. The editor calls it after
   * creating the node so the user can type the label immediately. Returns an
   * unregister function.
   */
  registerStartEdit: (nodeId: string, start: () => void) => () => void;
  /** Ask a registered node to enter inline editing. */
  requestStartEdit: (nodeId: string) => void;
};

const KEY = Symbol("diagram-editor-context");

/** An app widens the context with its own members: pass its type as `T`. */
export function setDiagramEditorContext<T extends DiagramEditorContext>(context: T) {
  setContext(KEY, context);
}

export function getDiagramEditorContext<
  T extends DiagramEditorContext = DiagramEditorContext,
>(): T | null {
  return getContext<T | undefined>(KEY) ?? null;
}
