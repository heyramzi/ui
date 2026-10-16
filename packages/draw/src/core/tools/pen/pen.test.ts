import { describe, expect, it } from "vitest";
import { createEditor, down, move, scriptPointer, up } from "../../editor";
import type { FreehandShape } from "../../shapes/freehand";
import { createPenTool } from "./pen";

function setup() {
  const editor = createEditor();
  editor.registerTool("pen", createPenTool);
  editor.setTool("pen");
  return editor;
}

const strokeOf = (editor: ReturnType<typeof setup>): FreehandShape | undefined =>
  editor.getShapes()[0] as FreehandShape | undefined;

describe("pen tool", () => {
  it("draws one stroke from pointer down to pointer up", () => {
    const editor = setup();
    scriptPointer(editor, [
      down([0, 0]),
      move([10, 0]),
      move([20, 10]),
      move([30, 0]),
      up([30, 0]),
    ]);

    const shapes = editor.getShapes();
    expect(shapes).toHaveLength(1);
    expect(shapes[0].type).toBe("freehand");
    expect(strokeOf(editor)!.props.points.length).toBeGreaterThanOrEqual(2);
  });

  it("commits the stroke as one undo step", () => {
    const editor = setup();
    scriptPointer(editor, [down([0, 0]), move([10, 10]), move([20, 0]), up([20, 0])]);
    expect(editor.getShapes()).toHaveLength(1);

    editor.undo();
    expect(editor.getShapes()).toHaveLength(0);
    editor.redo();
    expect(editor.getShapes()).toHaveLength(1);
  });

  it("leaves the store untouched on Escape", () => {
    const editor = setup();
    const before = JSON.stringify(editor.getStore().snapshot());

    scriptPointer(editor, [down([0, 0]), move([10, 10]), move([20, 0]), { type: "cancel" }]);

    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getActivePath()).toBe("pen.idle");
  });

  it("makes a dot from a tap with no move", () => {
    const editor = setup();
    scriptPointer(editor, [down([50, 50]), up([50, 50])]);

    const stroke = strokeOf(editor)!;
    expect(stroke).toBeDefined();
    expect(stroke.props.points).toHaveLength(1);
    expect(stroke.props.points[0]).toEqual({ x: 0, y: 0, pressure: 0.5 });
  });

  it("stays in the pen tool after a stroke", () => {
    const editor = setup();
    scriptPointer(editor, [down([0, 0]), move([10, 0]), up([10, 0])]);
    expect(editor.getActivePath()).toBe("pen.idle");

    scriptPointer(editor, [down([100, 100]), move([110, 100]), up([110, 100])]);
    expect(editor.getShapes()).toHaveLength(2);
  });

  it("keeps a constant width for mouse input and records pen pressure", () => {
    const mouse = setup();
    scriptPointer(mouse, [down([0, 0]), move([10, 0]), move([20, 0]), up([20, 0])]);
    expect(strokeOf(mouse)!.props.points.every((point) => point.pressure === 0.5)).toBe(true);

    const pen = setup();
    scriptPointer(pen, [
      down([0, 0]),
      move([10, 0], { pressure: 0.8 }),
      up([10, 0], { pressure: 0.8 }),
    ]);
    expect(strokeOf(pen)!.props.points.some((point) => point.pressure === 0.8)).toBe(true);
  });
});
