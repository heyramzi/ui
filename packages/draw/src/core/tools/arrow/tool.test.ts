import { describe, it, expect } from "vitest";
import { createEditor, type Editor } from "../../editor/editor";
import { scriptPointer, down, move, up } from "../../editor/testing";
import { installArrowSideEffects } from "../../bindings";
import { createArrowTool } from "./tool";
import { boxCenter } from "../../math/box";
import { rotate } from "../../math/vec";
import { distanceToBoxPerimeter } from "../../shapes/base";
import type { ArrowShape } from "../../shapes/arrow";
import type { ShapeRecord, Vec } from "../../types";

function setup(): Editor {
  const editor = createEditor();
  installArrowSideEffects(editor);
  editor.registerTool("arrow", createArrowTool);
  editor.registerTool("select", () => ({ id: "select" }));
  return editor;
}

function rect(editor: Editor, id: string, over: Partial<ShapeRecord> = {}): string {
  return editor.createShape({
    id,
    type: "rect",
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    props: { accent: "ink", fill: true, radius: 0 },
    ...over,
  });
}

const arrowOf = (editor: Editor): ArrowShape | undefined =>
  editor.getShapes().find((shape) => shape.type === "arrow") as ArrowShape | undefined;

const pageStart = (shape: ArrowShape): Vec => ({
  x: shape.x + shape.props.start.x,
  y: shape.y + shape.props.start.y,
});
const pageEnd = (shape: ArrowShape): Vec => ({
  x: shape.x + shape.props.end.x,
  y: shape.y + shape.props.end.y,
});

describe("createArrowTool binding", () => {
  it("binds the shape the drag ends on", () => {
    const editor = setup();
    rect(editor, "a", { x: 0, y: 0 });
    rect(editor, "b", { x: 300, y: 0 });
    editor.setTool("arrow");

    scriptPointer(editor, [down([50, 50]), move([350, 50]), up([350, 50])]);

    const arrow = arrowOf(editor);
    expect(arrow).toBeDefined();
    const bindings = editor.getBindingsFor(arrow!.id);
    expect(bindings).toHaveLength(2);
    expect(bindings.find((b) => b.terminal === "start")?.targetId).toBe("a");
    expect(bindings.find((b) => b.terminal === "end")?.targetId).toBe("b");
    expect(pageStart(arrow!).x).toBeCloseTo(100, 6);
    expect(pageEnd(arrow!).x).toBeCloseTo(300, 6);
  });

  it("leaves the tail free when the drag starts on empty canvas", () => {
    const editor = setup();
    rect(editor, "b", { x: 300, y: 0 });
    editor.setTool("arrow");

    scriptPointer(editor, [down([0, 300]), move([350, 50]), up([350, 50])]);

    const arrow = arrowOf(editor);
    const bindings = editor.getBindingsFor(arrow!.id);
    expect(bindings).toHaveLength(1);
    expect(bindings[0].terminal).toBe("end");
    expect(pageStart(arrow!)).toEqual({ x: 0, y: 300 });
  });

  it("deletes the empty arrow when the press does not drag", () => {
    const editor = setup();
    const before = JSON.stringify(editor.getStore().snapshot());
    editor.setTool("arrow");

    scriptPointer(editor, [down([500, 500]), up([500, 500])]);

    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getActivePath()).toBe("select");
  });

  it("restores everything on Escape", () => {
    const editor = setup();
    rect(editor, "a", { x: 0, y: 0 });
    rect(editor, "b", { x: 300, y: 0 });
    const before = JSON.stringify(editor.getStore().snapshot());
    editor.setTool("arrow");

    scriptPointer(editor, [down([50, 50]), move([350, 50]), { type: "cancel" }]);

    expect(JSON.stringify(editor.getStore().snapshot())).toBe(before);
    expect(editor.getActivePath()).toBe("select");
  });

  it("creates the arrow as one undo step", () => {
    const editor = setup();
    rect(editor, "a", { x: 0, y: 0 });
    rect(editor, "b", { x: 300, y: 0 });
    editor.setTool("arrow");

    scriptPointer(editor, [down([50, 50]), move([350, 50]), up([350, 50])]);
    expect(editor.getShapes()).toHaveLength(3);
    expect(editor.getSelectedIds()).toHaveLength(1);

    editor.undo();
    expect(editor.getShapes()).toHaveLength(2);
    expect(editor.getShapes().every((shape) => shape.type !== "arrow")).toBe(true);
    expect(Object.keys(editor.getStore().snapshot().bindings)).toHaveLength(0);

    editor.redo();
    expect(editor.getShapes()).toHaveLength(3);
  });

  it("snaps the angle to 15 degrees with shift", () => {
    const editor = setup();
    editor.setTool("arrow");

    scriptPointer(editor, [
      down([0, 0]),
      move([100, 60], { shift: true }),
      up([100, 60], { shift: true }),
    ]);

    const arrow = arrowOf(editor)!;
    const start = pageStart(arrow);
    const end = pageEnd(arrow);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    expect(angle).toBeCloseTo(Math.PI / 6, 6);
  });
});

describe("createArrowTool with bound targets moving", () => {
  function boundArrow(editor: Editor): ArrowShape {
    rect(editor, "a", { x: 0, y: 0 });
    rect(editor, "b", { x: 300, y: 0 });
    editor.setTool("arrow");
    scriptPointer(editor, [down([50, 50]), move([350, 50]), up([350, 50])]);
    return arrowOf(editor)!;
  }

  it("follows a moved box at both ends", () => {
    const editor = setup();
    const arrow = boundArrow(editor);

    editor.updateShapes([{ id: "b", x: 400 }]);
    const moved = editor.getShape(arrow.id) as ArrowShape;
    expect(pageStart(moved).x).toBeCloseTo(100, 6);
    expect(pageEnd(moved).x).toBeCloseTo(400, 6);
  });

  it("follows a resized box", () => {
    const editor = setup();
    const arrow = boundArrow(editor);

    editor.updateShapes([{ id: "b", w: 200 }]);
    const resized = editor.getShape(arrow.id) as ArrowShape;
    expect(pageEnd(resized).x).toBeCloseTo(300, 6);
  });

  it("keeps the end on a rotated box's outline", () => {
    const editor = setup();
    const arrow = boundArrow(editor);

    editor.updateShapes([{ id: "b", rotation: Math.PI / 4 }]);
    const turned = editor.getShape(arrow.id) as ArrowShape;
    const target = editor.getShape("b")!;
    const local = rotate(pageEnd(turned), boxCenter(target), -target.rotation);
    expect(distanceToBoxPerimeter(local, target)).toBeCloseTo(0, 6);
  });

  it("keeps the free end put when only one end is bound", () => {
    const editor = setup();
    rect(editor, "b", { x: 300, y: 0 });
    editor.setTool("arrow");
    scriptPointer(editor, [down([0, 300]), move([350, 50]), up([350, 50])]);
    const arrow = arrowOf(editor)!;

    editor.updateShapes([{ id: "b", x: 500 }]);
    const moved = editor.getShape(arrow.id) as ArrowShape;
    expect(pageStart(moved)).toEqual({ x: 0, y: 300 });
  });

  it("leaves the arrow in place when the target is deleted", () => {
    const editor = setup();
    const arrow = boundArrow(editor);
    const before = pageEnd(arrow);

    editor.deleteShapes(["b"]);
    const after = editor.getShape(arrow.id) as ArrowShape;
    expect(pageEnd(after)).toEqual(before);
  });
});
