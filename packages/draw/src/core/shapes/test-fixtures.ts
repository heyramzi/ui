import type { ShapeRecord, ShapeUtil } from "../types";

/** A complete shape from a util's defaults, with test overrides. */
export function make<S extends ShapeRecord>(
  util: ShapeUtil<S>,
  overrides: Partial<Omit<S, "id" | "index">> & { id?: string; index?: string } = {}
): S {
  const defaults = util.defaults();
  const { id = "shape-1", index = "a0", ...rest } = overrides;
  return { ...defaults, ...rest, id, index } as S;
}
