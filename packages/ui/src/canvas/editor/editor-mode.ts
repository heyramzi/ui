// A mode packs one family of interactions, so the editor never branches on node
// types. Each controller is built once, so its state survives a mode switch.

import type { Node, Edge, InternalNode } from "@xyflow/svelte";
import type { CanvasViewport } from "#src/canvas/types.js";
import type { CanvasDispatcher } from "#src/canvas/editor/dispatch.svelte.js";

/** A fraction of the pane, or a pixel margin per side, so a fit can clear the bars floating over it. */
export type FitPadding =
  | number
  | { top?: `${number}px`; right?: `${number}px`; bottom?: `${number}px`; left?: `${number}px` };

/** The xyflow instance surface the editor bridges via diagram-flow-helper. */
export type FlowActions = {
  screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  fitView: (options?: {
    padding?: FitPadding;
    nodes?: { id: string }[];
    maxZoom?: number;
    /** Overrides the glide, in ms. 0 jumps. */
    duration?: number;
  }) => Promise<boolean>;
  zoomIn: () => Promise<boolean>;
  zoomOut: () => Promise<boolean>;
  /** Zoom about the view centre to an exact scale. */
  zoomTo: (zoom: number) => Promise<boolean>;
  deleteElements: (params: {
    nodes?: { id: string }[];
    edges?: { id: string }[];
  }) => Promise<{ deletedNodes: Node[]; deletedEdges: Edge[] }>;
  toObject: () => { nodes: Node[]; edges: Edge[]; viewport: CanvasViewport };
  /** Read alone, for motion that must stay one screen pixel at any scale. */
  getViewport: () => CanvasViewport;
  /** Glides; a pan to bring something on screen. */
  setViewport: (viewport: CanvasViewport) => Promise<boolean>;
  /** Measured size and absolute position, which a nested card's own position lacks. */
  getInternalNode: (id: string) => InternalNode | undefined;
};

/** What the editor lends a controller. All access is lazy (getter closures). */
export type EditorModeDeps = {
  dispatcher: CanvasDispatcher;
  getNodes: () => Node[];
  setNodes: (nodes: Node[]) => void;
  getEdges: () => Edge[];
  setEdges: (edges: Edge[]) => void;
  getFlowActions: () => FlowActions | null;
  scheduleAutoSave: () => void;
  /** Ask a mounted node component to enter inline editing. */
  requestStartEdit: (nodeId: string) => void;
  /** Select a fresh node, then open its inline editor once the layout settles. */
  focusNewNode: (nodeId: string) => void;
};

/**
 * The delegation surface. Every hook is optional, called on each active mode in
 * the order the app lists them. `placeNode` returns true when it claimed the creation.
 */
export type EditorMode<Type extends string = string> = {
  placeNode?: (type: Type, position: { x: number; y: number }) => boolean;
  onNodeDragStart?: (targetNode: Node | null | undefined) => void;
  onNodeDrag?: (targetNode: Node | null | undefined) => void;
  onNodeDragStop?: (targetNode: Node | null | undefined) => void;
  handleKeydown?: (event: KeyboardEvent) => void;
  /** Runs inside the same dispatcher transaction that added the child. */
  onChildAdded?: (parent: Node) => void;
};
