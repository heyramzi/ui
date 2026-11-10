import { Extension } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import {
  NodeSelection,
  Selection,
  TextSelection,
  type EditorState,
  type Transaction,
} from "@tiptap/pm/state";

/**
 * Swaps the top-level block holding the selection with its neighbour, the same block the drag
 * handle moves. Null at the top or bottom of the document.
 */
export function moveBlock(state: EditorState, dir: -1 | 1): Transaction | null {
  const { selection, doc } = state;
  const index = selection.$from.index(0);
  const other = index + dir;
  if (other < 0 || other >= doc.childCount) return null;

  const node = doc.child(index);
  const start = selection.$from.posAtIndex(index, 0);
  const neighbour = doc.child(other);
  const from = dir === 1 ? start : start - neighbour.nodeSize;
  const to = from + node.nodeSize + neighbour.nodeSize;
  const pair = dir === 1 ? [neighbour, node] : [node, neighbour];
  const tr = state.tr.replaceWith(from, to, Fragment.fromArray(pair));

  const moved = dir === 1 ? from + neighbour.nodeSize : from;
  const shift = moved - start;
  const next =
    selection instanceof NodeSelection
      ? NodeSelection.create(tr.doc, selection.from + shift)
      : selection instanceof TextSelection
        ? TextSelection.create(tr.doc, selection.anchor + shift, selection.head + shift)
        : Selection.near(tr.doc.resolve(selection.head + shift));
  return tr.setSelection(next).scrollIntoView();
}

/** Alt+Shift+Up and Down: the keyboard way to do what the drag handle does. */
export const BlockMove = Extension.create({
  name: "blockMove",
  addKeyboardShortcuts() {
    const run = (dir: -1 | 1) => () => {
      const tr = moveBlock(this.editor.state, dir);
      if (!tr) return false;
      this.editor.view.dispatch(tr);
      return true;
    };
    return { "Alt-Shift-ArrowUp": run(-1), "Alt-Shift-ArrowDown": run(1) };
  },
});
