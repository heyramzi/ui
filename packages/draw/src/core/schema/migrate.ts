import { SCHEMA_VERSION, type Snapshot } from "../types";

/** An untyped saved object, before the chain has run. */
export type RawSnapshot = Record<string, unknown>;

/** One step: version n in, version n + 1 out. */
export type Migration = (raw: RawSnapshot) => RawSnapshot;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function defaultCamera(): RawSnapshot {
  return { x: 0, y: 0, zoom: 1 };
}

/**
 * v0 saved shapes as an array and had no bindings. v1 keys them by id and
 * adds the binding table. This is the worked example the chain runs first.
 */
export function migrateV0toV1(raw: RawSnapshot): RawSnapshot {
  const list = Array.isArray(raw.shapes) ? raw.shapes : [];
  const shapes: Record<string, unknown> = {};
  for (const item of list) {
    if (!isObject(item)) {
      continue;
    }
    const id = String(item.id);
    shapes[id] = {
      id,
      type: typeof item.type === "string" ? item.type : "rect",
      x: num(item.x),
      y: num(item.y),
      w: num(item.w),
      h: num(item.h),
      rotation: num(item.rotation),
      parentId: item.parentId ?? null,
      index: typeof item.index === "string" && item.index !== "" ? item.index : "a0",
      props: isObject(item.props) ? item.props : {},
    };
  }
  return {
    ...raw,
    schema: 1,
    shapes,
    bindings: isObject(raw.bindings) ? raw.bindings : {},
    camera: isObject(raw.camera) ? raw.camera : defaultCamera(),
  };
}

/** Steps indexed by the version they start from. `migrations[0]` makes v1 from v0. */
export const migrations: Record<number, Migration> = {
  0: migrateV0toV1,
};

function assertShape(value: unknown, id: string): void {
  if (!isObject(value)) {
    throw new Error(`shape "${id}" is not an object`);
  }
  if (value.id !== id) {
    throw new Error(`shape "${id}" has a mismatched id "${String(value.id)}"`);
  }
  if (typeof value.type !== "string") {
    throw new Error(`shape "${id}" needs a string type`);
  }
  for (const field of ["x", "y", "w", "h", "rotation"]) {
    if (typeof value[field] !== "number") {
      throw new Error(`shape "${id}" needs a number ${field}`);
    }
  }
  if (value.parentId !== null && typeof value.parentId !== "string") {
    throw new Error(`shape "${id}" needs parentId as a string or null`);
  }
  if (typeof value.index !== "string") {
    throw new Error(`shape "${id}" needs a string index`);
  }
  if (!isObject(value.props)) {
    throw new Error(`shape "${id}" needs a props object`);
  }
}

function assertBinding(value: unknown, id: string): void {
  if (!isObject(value)) {
    throw new Error(`binding "${id}" is not an object`);
  }
  if (value.id !== id) {
    throw new Error(`binding "${id}" has a mismatched id "${String(value.id)}"`);
  }
  if (typeof value.arrowId !== "string" || typeof value.targetId !== "string") {
    throw new Error(`binding "${id}" needs arrowId and targetId strings`);
  }
  if (value.terminal !== "start" && value.terminal !== "end") {
    throw new Error(`binding "${id}" needs terminal "start" or "end"`);
  }
  const anchor = value.anchor;
  if (!isObject(anchor) || typeof anchor.x !== "number" || typeof anchor.y !== "number") {
    throw new Error(`binding "${id}" needs an anchor with x and y`);
  }
}

function assertSnapshot(raw: RawSnapshot): void {
  if (raw.schema !== SCHEMA_VERSION) {
    throw new Error(`migrated snapshot is version ${String(raw.schema)}, expected ${SCHEMA_VERSION}`);
  }
  if (!isObject(raw.shapes)) {
    throw new Error("snapshot.shapes must be an object keyed by id");
  }
  for (const [id, shape] of Object.entries(raw.shapes)) {
    assertShape(shape, id);
  }
  if (!isObject(raw.bindings)) {
    throw new Error("snapshot.bindings must be an object keyed by id");
  }
  for (const [id, binding] of Object.entries(raw.bindings)) {
    assertBinding(binding, id);
  }
  const camera = raw.camera;
  if (!isObject(camera)) {
    throw new Error("snapshot.camera must be an object");
  }
  for (const field of ["x", "y", "zoom"]) {
    if (typeof camera[field] !== "number") {
      throw new Error(`snapshot.camera needs a number ${field}`);
    }
  }
}

/** Bring any saved object up to the current schema, or throw with the reason. */
export function migrate(raw: unknown): Snapshot {
  if (!isObject(raw)) {
    throw new Error("snapshot must be an object");
  }
  let current: RawSnapshot = { ...raw };
  const version = current.schema;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) {
    throw new Error("snapshot.schema must be a non-negative integer");
  }
  if (version > SCHEMA_VERSION) {
    throw new Error(`snapshot is version ${version}, newer than ${SCHEMA_VERSION}`);
  }
  let moving = version;
  while (moving < SCHEMA_VERSION) {
    const step = migrations[moving];
    if (!step) {
      throw new Error(`no migration from version ${moving}`);
    }
    current = step(current);
    moving += 1;
  }
  assertSnapshot(current);
  return current as unknown as Snapshot;
}
