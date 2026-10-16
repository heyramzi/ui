// The contracts every module codes against. Plain data in, plain data out:
// nothing in src/core may import svelte, the DOM or any app code.

export type Id = string;
export type Vec = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** One drawn thing. A flat record, so undo is a diff and sync is an adapter. */
export type ShapeRecord<Type extends string = string, Props = Record<string, unknown>> = {
  id: Id;
  type: Type;
  /** Top-left corner in page space, before rotation. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Radians, around the box centre. */
  rotation: number;
  /** A frame or group this shape sits inside, or null on the page. */
  parentId: Id | null;
  /** Fractional z-order key. Strings sort, so inserting never renumbers siblings. */
  index: string;
  props: Props;
};

/** A link between an arrow end and a shape. Stored apart from both, so moving a box re-routes the arrow. */
export type BindingRecord = {
  id: Id;
  arrowId: Id;
  targetId: Id;
  terminal: "start" | "end";
  /** Where on the target the end sticks, 0 to 1 across its box. */
  anchor: Vec;
};

export type Camera = { x: number; y: number; zoom: number };

export const SCHEMA_VERSION = 1;

/** The saved form of a page. Versioned, so an old file can always be migrated forward. */
export type Snapshot = {
  schema: number;
  shapes: Record<Id, ShapeRecord>;
  bindings: Record<Id, BindingRecord>;
  camera: Camera;
};

export type RecordMap = { shapes: ShapeRecord; bindings: BindingRecord };

/** What changed, by table. Undo applies it backwards, a sync layer sends it as is. */
export type Diff = {
  [T in keyof RecordMap]?: {
    added: Record<Id, RecordMap[T]>;
    updated: Record<Id, [before: RecordMap[T], after: RecordMap[T]]>;
    removed: Record<Id, RecordMap[T]>;
  };
};

export type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** What a shape type must know how to do. One util per type, registered by name. */
export interface ShapeUtil<S extends ShapeRecord = ShapeRecord> {
  readonly type: S["type"];
  /** A fresh shape's fields, so a tool never hardcodes another type's defaults. */
  defaults(): Omit<S, "id" | "index">;
  /** The tight box in page space, rotation applied. */
  bounds(shape: S): Box;
  /** True when a point is on the shape, within `margin` page units. Stroke-only shapes are hit on the line, not the box. */
  hitTest(shape: S, point: Vec, margin: number): boolean;
  /** The size a resize drag lands on. Return only the fields that change. */
  resize(shape: S, handle: Handle, to: Box): Partial<S>;
  /** Headless render. The seed keeps the hand-drawn wobble stable across server and client. */
  toSvg(shape: S, ctx: SvgContext): string;
}

export type SvgContext = {
  dark: boolean;
  /** "hand" wobbles like a pen, "clean" draws straight. */
  style: "hand" | "clean";
};

export type PointerInfo = {
  /** Page space, after the camera. */
  point: Vec;
  /** Screen space, for drag thresholds. */
  screen: Vec;
  /** 0 to 1. A mouse reports 0.5 while pressed. */
  pressure: number;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  /** The topmost shape under the pointer, if any. */
  targetId: Id | null;
  pointerType: "mouse" | "pen" | "touch";
  /** 1 for a click, 2 for a double click, 3 for a triple. The renderer counts them. */
  clicks: number;
};

/** One node of a tool's state machine. A tool is a tree of these, and the editor keeps the path to the active leaf. */
export interface ToolState {
  readonly id: string;
  /** Child states, by id. A state with children enters `initial` first. */
  readonly children?: Record<string, ToolState>;
  readonly initial?: string;
  onEnter?(info?: unknown): void;
  onExit?(): void;
  onPointerDown?(e: PointerInfo): void;
  onPointerMove?(e: PointerInfo): void;
  onPointerUp?(e: PointerInfo): void;
  onKeyDown?(key: string, mods: { shift: boolean; alt: boolean; meta: boolean }): void;
  onKeyUp?(key: string): void;
  /** Escape, or a lost pointer. Leave nothing half-applied. */
  onCancel?(): void;
}

/**
 * The props a custom node component gets. Same fields as xyflow's NodeProps on
 * purpose, so the existing node components render in this engine unchanged.
 */
export type NodeComponentProps<Data = Record<string, unknown>> = {
  id: Id;
  data: Data;
  selected: boolean;
  width: number;
  height: number;
};

// =========================
// EDITOR (what tools talk to)
// =========================

export type Tables = Pick<Snapshot, "shapes" | "bindings">;

export type Mods = { shift: boolean; alt: boolean; meta: boolean };

/** A pointer as the renderer sees it. The editor adds the page point and the shape under it. */
export type PointerInput = Omit<PointerInfo, "point" | "targetId">;

export type EditorEvent =
  | { type: "pointer_down" | "pointer_move" | "pointer_up"; input: PointerInput }
  | { type: "key_down"; key: string; mods: Mods }
  | { type: "key_up"; key: string }
  | { type: "cancel" };

/** A snap line the renderer draws while a drag is snapped. */
export type Guide = { axis: "x" | "y"; at: number; from: number; to: number };

/** Builds a tool's root state. It gets the editor so its states can read and write through it. */
export type ToolFactory = (editor: EditorApi) => ToolState;

/** Everything a tool may do; tools never touch the store directly, and a gesture is one undo step that cancel restores exactly. */
export interface EditorApi {
  // read
  getShape(id: Id): ShapeRecord | undefined;
  /** Every shape, back to front. */
  getShapes(): ShapeRecord[];
  getChildren(id: Id): ShapeRecord[];
  getBindingsFor(shapeId: Id): BindingRecord[];
  getSelectedIds(): Id[];
  getCamera(): Camera;
  getShapeUtil(type: string): ShapeUtil;
  /** Bounds in page space, rotation applied. */
  getPageBounds(id: Id): Box;
  /** Topmost shape under a page point. `margin` is in screen pixels, scaled by zoom inside. */
  getTopShapeAt(point: Vec, margin?: number): Id | null;
  getShapesInBox(box: Box, mode: "contain" | "intersect"): Id[];

  // write
  select(ids: Id[]): void;
  /** Fills missing fields from the util's defaults, puts it on top, returns its id. */
  createShape(partial: Partial<ShapeRecord> & { type: string }): Id;
  updateShapes(patches: (Partial<ShapeRecord> & { id: Id })[]): void;
  /** Removes the shapes, their children and their bindings. */
  deleteShapes(ids: Id[]): void;
  createBinding(binding: Omit<BindingRecord, "id">): Id;
  deleteBinding(id: Id): void;
  reorder(ids: Id[], to: "front" | "back" | "forward" | "backward"): void;

  // gestures and history
  beginGesture(label: string): void;
  commitGesture(): void;
  cancelGesture(): void;
  undo(): void;
  redo(): void;

  // camera
  setCamera(camera: Camera): void;

  // tools
  setTool(id: string): void;
  /** Dotted path to a state, for example "select.translating". Runs onExit then onEnter along the way. */
  transition(path: string, info?: unknown): void;
  getActivePath(): string;
  registerTool(id: string, factory: ToolFactory): void;

  // overlays the renderer draws
  setBrush(box: Box | null): void;
  setGuides(guides: Guide[]): void;
  setCursor(cursor: string): void;

  /** The shape whose text is being edited, if any. The renderer shows an editor over it. */
  setEditingId(id: Id | null): void;
  getEditingId(): Id | null;

  // input and change
  dispatch(event: EditorEvent): void;
  onChange(listener: () => void): () => void;
  /** Fires after every mutation, live inside a gesture too. A side effect that edits shapes in here must ignore its own changes. */
  onDiff(listener: (diff: Diff) => void): () => void;
}
