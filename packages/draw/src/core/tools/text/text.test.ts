import { describe, expect, it } from "vitest";
import { createEditor, down, scriptPointer, up } from "../../editor";
import { createTextTool, finishEditing } from "./text";

function setup() {
  const editor = createEditor();
  editor.registerTool("text", createTextTool);
  editor.registerTool("select", () => ({ id: "select" }));
  editor.setTool("text");
  return editor;
}

describe("text tool", () => {
  it("creates an empty text shape on a click and starts editing it", () => {
    const editor = setup();
    scriptPointer(editor, [down([100, 100]), up([100, 100])]);

    const shape = editor.getShapes()[0];
    expect(shape.type).toBe("text");
    expect(shape).toMatchObject({ x: 100, y: 100 });
    expect((shape.props as { text: string }).text).toBe("");
    expect(editor.getEditingId()).toBe(shape.id);
    expect(editor.getSelectedIds()).toEqual([shape.id]);
    expect(editor.getActivePath()).toBe("select");
  });

  it("writes the text when editing finishes", () => {
    const editor = setup();
    scriptPointer(editor, [down([100, 100]), up([100, 100])]);
    const id = editor.getShapes()[0].id;

    finishEditing(editor, id, "hello");

    expect((editor.getShape(id)!.props as { text: string }).text).toBe("hello");
    expect(editor.getEditingId()).toBeNull();
  });

  it("deletes the shape when editing ends blank", () => {
    const editor = setup();
    scriptPointer(editor, [down([100, 100]), up([100, 100])]);
    const id = editor.getShapes()[0].id;

    finishEditing(editor, id, "   ");

    expect(editor.getShape(id)).toBeUndefined();
    expect(editor.getEditingId()).toBeNull();
  });
});
