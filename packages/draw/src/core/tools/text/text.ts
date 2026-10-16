// The text tool: a click drops an empty text shape and starts editing, and
// `finishEditing` keeps the text or deletes the shape if it stayed blank.

import type { EditorApi, Id, ToolFactory, ToolState } from "../../types";

/** Save a finished edit: write the text, or drop the shape when it is blank. */
export function finishEditing(editor: EditorApi, id: Id, text: string): void {
  const shape = editor.getShape(id);
  if (shape) {
    if (text.trim() === "") editor.deleteShapes([id]);
    else if (typeof (shape.props as { text?: unknown }).text === "string") {
      editor.updateShapes([{ id, props: { ...shape.props, text } }]);
    } else {
      // A frame carries its label in `name`, so an edit lands there instead.
      editor.updateShapes([{ id, props: { ...shape.props, name: text } }]);
    }
  }
  editor.setEditingId(null);
}

export const createTextTool: ToolFactory = (editor: EditorApi): ToolState => {
  const idle: ToolState = {
    id: "idle",
    onPointerDown() {
      editor.transition("text.pointing");
    },
  };

  const pointing: ToolState = {
    id: "pointing",
    onPointerUp(e) {
      const id = editor.createShape({ type: "text", x: e.point.x, y: e.point.y });
      editor.select([id]);
      editor.setEditingId(id);
      editor.setTool("select");
    },
    onCancel() {
      editor.transition("text.idle");
    },
  };

  return {
    id: "text",
    initial: "idle",
    onEnter() {
      editor.setCursor("crosshair");
    },
    onExit() {
      editor.setCursor("default");
    },
    children: { idle, pointing },
  };
};
