import type { ShapeUtil } from "../types";
import { rectUtil } from "./rect";
import { ellipseUtil } from "./ellipse";
import { diamondUtil } from "./diamond";
import { lineUtil } from "./line";
import { arrowUtil } from "./arrow";
import { textUtil } from "./text";
import { noteUtil } from "./note";
import { frameUtil } from "./frame";
import { imageUtil } from "./image";
import { freehandUtil } from "./freehand";
import { nodeUtil } from "./node";

export type ShapeRegistry = {
  /** The util for a type. Throws a clear error on an unknown type, never returns undefined. */
  get(type: string): ShapeUtil;
};

/** Build a registry from a list of utils, later entries winning on a duplicate type. */
export function createShapeRegistry(utils: ShapeUtil[]): ShapeRegistry {
  const byType = new Map<string, ShapeUtil>();
  for (const util of utils) byType.set(util.type, util);
  return {
    get(type: string): ShapeUtil {
      const util = byType.get(type);
      if (!util) throw new Error(`Unknown shape type: "${type}"`);
      return util;
    },
  };
}

/** Every built-in shape. */
export const defaultShapes: ShapeUtil[] = [
  rectUtil,
  ellipseUtil,
  diamondUtil,
  lineUtil,
  arrowUtil,
  textUtil,
  noteUtil,
  frameUtil,
  imageUtil,
  freehandUtil,
  nodeUtil,
];

const defaultRegistry = createShapeRegistry(defaultShapes);

/** Look a type up in the default registry. */
export function get(type: string): ShapeUtil {
  return defaultRegistry.get(type);
}
