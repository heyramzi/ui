import { it, expect, describe } from "vitest";
import type { PointerInfo, ToolState } from "../types";
import { createEditor } from "./editor";
import { down, move, up, scriptPointer, type ScriptStep } from "./testing";

function probe(editor: ReturnType<typeof createEditor>, log: PointerInfo[], keys: string[]) {
  return () =>
    ({
      id: "probe",
      initial: "idle",
      children: {
        idle: {
          id: "idle",
          onPointerDown: (e: PointerInfo) => log.push(e),
          onPointerMove: (e: PointerInfo) => log.push(e),
          onPointerUp: (e: PointerInfo) => log.push(e),
          onKeyDown: (key: string, mods) => keys.push(`${key}:${mods.shift ? "shift" : "none"}`),
          onKeyUp: (key: string) => keys.push(`up:${key}`),
        } satisfies ToolState,
      },
    }) as ToolState;
}

describe("scriptPointer", () => {
  it("fills sane defaults for pressure, mods and pointer type", () => {
    const editor = createEditor();
    const log: PointerInfo[] = [];
    editor.registerTool("probe", probe(editor, log, []));
    editor.setTool("probe");
    scriptPointer(editor, [down([3, 4]), move({ x: 5, y: 6 }), up([7, 8])]);
    expect(log.map((e) => e.screen)).toEqual([
      { x: 3, y: 4 },
      { x: 5, y: 6 },
      { x: 7, y: 8 },
    ]);
    expect(log.every((e) => e.pressure === 0.5)).toBe(true);
    expect(log.every((e) => e.pointerType === "mouse")).toBe(true);
    expect(log.every((e) => e.clicks === 1)).toBe(true);
    expect(log.every((e) => e.shift === false && e.alt === false && e.meta === false)).toBe(true);
  });

  it("passes options through and sends key steps", () => {
    const editor = createEditor();
    const log: PointerInfo[] = [];
    const keys: string[] = [];
    editor.registerTool("probe", probe(editor, log, keys));
    editor.setTool("probe");
    const steps: ScriptStep[] = [
      down([0, 0], { shift: true, pressure: 0.9, clicks: 2 }),
      { type: "key_down", key: "z", mods: { meta: true } },
      { type: "key_up", key: "z" },
    ];
    scriptPointer(editor, steps);
    expect(log[0]?.shift).toBe(true);
    expect(log[0]?.pressure).toBe(0.9);
    expect(log[0]?.clicks).toBe(2);
    expect(keys).toEqual(["z:none", "up:z"]);
  });
});
