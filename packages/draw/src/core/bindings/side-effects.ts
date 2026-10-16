import type { Diff, EditorApi, Id } from "../types";
import { fitArrowEnds, type ArrowShape } from "../shapes/arrow";
import { resolveArrowEnds } from "./resolve";

type ArrowPatch = Partial<ArrowShape> & { id: Id };

/** True when a bound arrow's stored geometry already matches the patch. */
function unchanged(arrow: ArrowShape, patch: Partial<ArrowShape>): boolean {
  if (arrow.x === patch.x && arrow.y === patch.y && arrow.w === patch.w && arrow.h === patch.h) {
    const start = patch.props?.start;
    const end = patch.props?.end;
    if (
      start &&
      end &&
      arrow.props.start.x === start.x &&
      arrow.props.start.y === start.y &&
      arrow.props.end.x === end.x &&
      arrow.props.end.y === end.y
    ) {
      return true;
    }
  }
  return false;
}

function patchesFor(editor: EditorApi, diff: Diff): ArrowPatch[] {
  const updated = diff.shapes?.updated;
  if (!updated) return [];

  const byArrow = new Map<Id, ArrowPatch>();
  for (const id of Object.keys(updated)) {
    const target = editor.getShape(id);
    if (!target || target.type === "arrow") continue;

    for (const binding of editor.getBindingsFor(id)) {
      if (binding.targetId !== id) continue;
      const arrow = editor.getShape(binding.arrowId);
      if (!arrow || arrow.type !== "arrow" || arrow.rotation !== 0) continue;

      const shape = arrow as ArrowShape;
      const ends = resolveArrowEnds(shape, editor.getBindingsFor(shape.id), (sid) =>
        editor.getShape(sid),
      );
      const patch: ArrowPatch = { id: shape.id, ...fitArrowEnds(shape, ends.start, ends.end) };
      if (!unchanged(shape, patch)) byArrow.set(shape.id, patch);
    }
  }
  return [...byArrow.values()];
}

/** Keeps bound arrows attached by re-fitting them live when their target moves, resizes or rotates; its own writes are skipped so it never loops. */
export function installArrowSideEffects(editor: EditorApi): () => void {
  let updating = false;
  return editor.onDiff((diff) => {
    if (updating) return;
    const patches = patchesFor(editor, diff);
    if (patches.length === 0) return;
    updating = true;
    try {
      editor.updateShapes(patches);
    } finally {
      updating = false;
    }
  });
}
