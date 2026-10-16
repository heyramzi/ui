import { describe, expect, it } from "vitest";
import { createEditor, down, move, scriptPointer, up } from "../../editor";
import type { Editor } from "../../editor/editor";
import { createEraserTool } from "./eraser";

function setup() {
  const editor = createEditor();
  editor.registerTool("eraser", createEraserTool);
  editor.registerTool("select", () => ({ id: "select" }));
  editor.setTool("eraser");
  return editor;
}

function box(editor: Editor, id: string, x: number, y: number): void {
  editor.createShape({
    id,
    type: "rect",
    x,
    y,
    w: 100,
    h: 100,
    props: { accent: "ink", fill: true, radius: 0 },
  });
}

describe("eraser tool", () => {
  it("erases the shape under the press as one undo step", () => {
    const editor = setup();
    box(editor, "a", 0, 0);

    scriptPointer(editor, [down([50, 50]), up([50, 50])]);

    expect(editor.getShapes()).toHaveLength(0);
    editor.undo();
    expect(editor.getShapes()).toHaveLength(1);
    expect(editor.getShapes()[0].id).toBe("a");
  });

  it("skips nothing on a fast drag across several shapes", () => {
    const editor = setup();
    box(editor, "a", 0, 0);
    box(editor, "b", 150, 0);
    box(editor, "c", 300, 0);

    scriptPointer(editor, [down([50, 50]), move([350, 50]), up([350, 50])]);

    expect(editor.getShapes()).toHaveLength(0);

    editor.undo();
    expect(editor.getShapes()).toHaveLength(3);
  });

  it("restores every shape on Escape", () => {
    const editor = setup();
    box(editor, "a", 0, 0);
    box(editor, "b", 300, 0);
    const before = JSON.stringify(editor.getStore().snapshot());

    scriptPointer(editor, [down([50, 50]), move([350, 50]), { type: "cancel" }]);

    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getShapes()).toHaveLength(2);
    expect(editor.getActivePath()).toBe("eraser.idle");
  });

  it("changes nothing when the drag touches no shape", () => {
    const editor = setup();
    box(editor, "a", 0, 0);
    const before = JSON.stringify(editor.getStore().snapshot());

    scriptPointer(editor, [down([1000, 1000]), move([1100, 1100]), up([1100, 1100])]);

    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
  });
});
