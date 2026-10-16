import { it, expect, describe } from "vitest";
import type { PointerInfo, ToolState } from "../types";
import { createEditor } from "./editor";

function info(): PointerInfo {
  return {
    point: { x: 0, y: 0 },
    screen: { x: 0, y: 0 },
    pressure: 0.5,
    shift: false,
    alt: false,
    meta: false,
    targetId: null,
    pointerType: "mouse",
    clicks: 1,
  };
}

function buildTree(log: string[]): ToolState {
  const leaf = (id: string): ToolState => ({
    id,
    onEnter: () => log.push(`enter ${id}`),
    onExit: () => log.push(`exit ${id}`),
    onCancel: () => log.push(`cancel ${id}`),
  });
  return {
    id: "select",
    onEnter: () => log.push("enter select"),
    onExit: () => log.push("exit select"),
    onCancel: () => log.push("cancel select"),
    initial: "idle",
    children: {
      idle: leaf("idle"),
      dragging: {
        id: "dragging",
        onEnter: () => log.push("enter dragging"),
        onExit: () => log.push("exit dragging"),
        onPointerDown: () => log.push("down dragging"),
        onCancel: () => log.push("cancel dragging"),
        initial: "moving",
        children: {
          moving: leaf("moving"),
          resizing: leaf("resizing"),
        },
      },
    },
  };
}

function setup(): { editor: ReturnType<typeof createEditor>; log: string[] } {
  const editor = createEditor();
  const log: string[] = [];
  editor.registerTool("select", () => buildTree(log));
  editor.setTool("select");
  log.length = 0;
  return { editor, log };
}

describe("tool runner transitions", () => {
  it("enters the root and its initial child on setTool", () => {
    const editor = createEditor();
    const log: string[] = [];
    editor.registerTool("select", () => buildTree(log));
    editor.setTool("select");
    expect(log).toEqual(["enter select", "enter idle"]);
    expect(editor.getActivePath()).toBe("select.idle");
  });

  it("exits to the common ancestor then enters down", () => {
    const { editor, log } = setup();
    editor.transition("select.dragging.resizing");
    expect(log).toEqual(["exit idle", "enter dragging", "enter resizing"]);
    expect(editor.getActivePath()).toBe("select.dragging.resizing");
  });

  it("enters a branch's initial child when it lands on the branch", () => {
    const { editor, log } = setup();
    editor.transition("select.dragging");
    expect(log).toEqual(["exit idle", "enter dragging", "enter moving"]);
    expect(editor.getActivePath()).toBe("select.dragging.moving");
  });

  it("swaps siblings under the same parent", () => {
    const { editor, log } = setup();
    editor.transition("select.dragging.resizing");
    log.length = 0;
    editor.transition("select.dragging.moving");
    expect(log).toEqual(["exit resizing", "enter moving"]);
  });

  it("throws on an unknown path", () => {
    const { editor } = setup();
    expect(() => editor.transition("select.nope")).toThrow(/Unknown tool state path/);
    expect(() => editor.transition("other.idle")).toThrow(/Unknown tool state path/);
    expect(() => editor.setTool("missing")).toThrow(/Unknown tool/);
  });
});

describe("tool runner dispatch", () => {
  it("bubbles a pointer handler up to the nearest state that has one", () => {
    const { editor, log } = setup();
    editor.transition("select.dragging.resizing");
    log.length = 0;
    editor.dispatch({ type: "pointer_down", input: { ...info(), screen: { x: 1, y: 1 } } });
    expect(log).toEqual(["down dragging"]);
  });

  it("bubbles keys the same way", () => {
    const editor = createEditor();
    const log: string[] = [];
    editor.registerTool("keys", () => ({
      id: "keys",
      onKeyDown: (key) => log.push(`root:${key}`),
      initial: "idle",
      children: { idle: { id: "idle" } },
    }));
    editor.setTool("keys");
    editor.dispatch({ type: "key_down", key: "a", mods: { shift: false, alt: false, meta: false } });
    expect(log).toEqual(["root:a"]);
  });

  it("runs onCancel on the whole active path, leaf first", () => {
    const { editor, log } = setup();
    editor.transition("select.dragging.moving");
    log.length = 0;
    editor.dispatch({ type: "cancel" });
    expect(log).toEqual(["cancel moving", "cancel dragging", "cancel select"]);
  });
});
