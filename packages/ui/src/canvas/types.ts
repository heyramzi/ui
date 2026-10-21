// The canvas's own shapes. A node's `type` is any string and its `data` is any record,
// so an app's closed union of kinds is assignable to these without a cast.

export type CanvasPoint = { x: number; y: number };

/** A node as stored: what a board file or a database row holds. */
// Type aliases, not interfaces: an alias is assignable to Record<string, unknown>, which the
// ops and the save queue rely on.
export type CanvasNode<Data extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  type: string;
  position: CanvasPoint;
  data: Data;
  parentId?: string;
  extent?: "parent";
  style?: Record<string, unknown>;
  width?: number;
  height?: number;
  /** Stacking layer among siblings, set by bring forward and send back. A missing one is 0. */
  zIndex?: number;
};

export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  sourceHandle?: string;
  targetHandle?: string;
  style?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

export type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasData<N extends CanvasNode = CanvasNode, E extends CanvasEdge = CanvasEdge> = {
  nodes: N[];
  edges: E[];
  viewport?: CanvasViewport;
};

/** A board straight from storage, before any node is checked against a kind. */
export type RawCanvasData = {
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  viewport?: Record<string, unknown>;
};
