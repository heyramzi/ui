import { describe, expect, it } from "vitest";
import { createEditor, down, move, scriptPointer, up } from "../../editor";
import { createShapeTool } from "./shape";

const SHAPE_TYPES = ["rect", "ellipse", "diamond", "line", "note", "frame"];

function setup(type: string) {
  const editor = createEditor();
  editor.registerTool(type, createShapeTool(type));
  editor.registerTool("select", () => ({ id: "select" }));
  editor.setTool(type);
  return editor;
}

describe("shape tool", () => {
  it("draws a rect from the down point to the pointer", () => {
    const editor = setup("rect");
    scriptPointer(editor, [down([100, 100]), move([250, 180]), up([250, 180])]);

    const shape = editor.getShapes()[0];
    expect(shape.type).toBe("rect");
    expect(shape).toMatchObject({ x: 100, y: 100, w: 150, h: 80 });
  });

  it("commits the shape as one undo step, selects it and returns to select", () => {
    const editor = setup("rect");
    scriptPointer(editor, [down([0, 0]), move([120, 80]), up([120, 80])]);

    const shape = editor.getShapes()[0];
    expect(editor.getSelectedIds()).toEqual([shape.id]);
    expect(editor.getActivePath()).toBe("select");

    editor.undo();
    expect(editor.getShapes()).toHaveLength(0);
    editor.redo();
    expect(editor.getShapes()).toHaveLength(1);
  });

  it("makes a square with shift", () => {
    const editor = setup("rect");
    scriptPointer(editor, [
      down([0, 0]),
      move([100, 60], { shift: true }),
      up([100, 60], { shift: true }),
    ]);

    const shape = editor.getShapes()[0];
    expect(shape.w).toBe(100);
    expect(shape.h).toBe(100);
  });

  it("draws from the center with alt", () => {
    const editor = setup("rect");
    scriptPointer(editor, [
      down([200, 200]),
      move([250, 240], { alt: true }),
      up([250, 240], { alt: true }),
    ]);

    const shape = editor.getShapes()[0];
    expect(shape.w).toBe(100);
    expect(shape.h).toBe(80);
    expect(shape.x + shape.w / 2).toBe(200);
    expect(shape.y + shape.h / 2).toBe(200);
  });

  it("creates the default size centered on a click", () => {
    const editor = setup("rect");
    scriptPointer(editor, [down([300, 300]), up([300, 300])]);

    const shape = editor.getShapes()[0];
    expect(shape).toMatchObject({ x: 220, y: 250, w: 160, h: 100 });
    expect(editor.getSelectedIds()).toEqual([shape.id]);
    expect(editor.getActivePath()).toBe("select");
  });

  it("snaps a line to 15 degree spokes with shift", () => {
    const editor = setup("line");
    scriptPointer(editor, [
      down([0, 0]),
      move([100, 60], { shift: true }),
      up([100, 60], { shift: true }),
    ]);

    const shape = editor.getShapes()[0];
    expect(shape.type).toBe("line");
    const points = (shape.props as { points: { x: number; y: number }[] }).points;
    const start = { x: shape.x + points[0].x, y: shape.y + points[0].y };
    const end = { x: shape.x + points[1].x, y: shape.y + points[1].y };
    expect(Math.atan2(end.y - start.y, end.x - start.x)).toBeCloseTo(Math.PI / 6, 6);
  });

  it("centers a line on the down point with alt", () => {
    const editor = setup("line");
    scriptPointer(editor, [
      down([100, 100]),
      move([160, 140], { alt: true }),
      up([160, 140], { alt: true }),
    ]);

    const shape = editor.getShapes()[0];
    const points = (shape.props as { points: { x: number; y: number }[] }).points;
    const start = { x: shape.x + points[0].x, y: shape.y + points[0].y };
    const end = { x: shape.x + points[1].x, y: shape.y + points[1].y };
    expect((start.x + end.x) / 2).toBe(100);
    expect((start.y + end.y) / 2).toBe(100);
  });

  it("leaves the store untouched on Escape", () => {
    const editor = setup("rect");
    const before = JSON.stringify(editor.getStore().snapshot());

    scriptPointer(editor, [down([0, 0]), move([120, 80]), { type: "cancel" }]);

    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getActivePath()).toBe("rect.idle");
  });

  it("draws every supported shape type", () => {
    for (const type of SHAPE_TYPES) {
      const editor = setup(type);
      scriptPointer(editor, [down([100, 100]), move([180, 140]), up([180, 140])]);
      const shapes = editor.getShapes();
      expect(shapes).toHaveLength(1);
      expect(shapes[0].type).toBe(type);
    }
  });
});
