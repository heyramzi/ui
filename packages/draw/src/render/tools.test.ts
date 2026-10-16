import { describe, expect, it } from "vitest";
import { createEditor } from "../core";
import { registerDefaultTools, TOOL_SHORTCUTS } from "./tools";

describe("TOOL_SHORTCUTS", () => {
  it("maps every letter the renderer advertises", () => {
    expect(TOOL_SHORTCUTS).toEqual({
      v: "select",
      h: "hand",
      p: "pen",
      r: "rect",
      o: "ellipse",
      d: "diamond",
      l: "line",
      a: "arrow",
      t: "text",
      e: "eraser",
      n: "note",
      f: "frame",
    });
  });
});

describe("registerDefaultTools", () => {
  it("registers every tool and starts on select", () => {
    const editor = createEditor();
    registerDefaultTools(editor);
    expect(editor.getActivePath()).toBe("select.idle");
    for (const tool of Object.values(TOOL_SHORTCUTS)) {
      editor.setTool(tool);
      const path = editor.getActivePath();
      expect(path === tool || path.startsWith(`${tool}.`)).toBe(true);
    }
  });

  it("is safe to call twice for the same editor", () => {
    const editor = createEditor();
    registerDefaultTools(editor);
    registerDefaultTools(editor);
    expect(editor.getActivePath()).toBe("select.idle");
  });
});
