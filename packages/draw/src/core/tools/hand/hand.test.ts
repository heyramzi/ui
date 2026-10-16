import { describe, expect, it } from "vitest";
import { createEditor, down, move, scriptPointer, up } from "../../editor";
import { createHandTool } from "./hand";

describe("hand tool", () => {
  it("shows the grab cursor while idle", () => {
    const editor = createEditor();
    editor.registerTool("hand", createHandTool);
    editor.setTool("hand");
    expect(editor.getCursor()).toBe("grab");
  });

  it("pans the camera by the screen drag", () => {
    const editor = createEditor();
    editor.registerTool("hand", createHandTool);
    editor.setTool("hand");
    scriptPointer(editor, [down([100, 100]), move([150, 120]), up([150, 120])]);
    expect(editor.getCamera()).toEqual({ x: -50, y: -20, zoom: 1 });
    expect(editor.getCursor()).toBe("grab");
  });

  it("pans in page units when zoomed", () => {
    const editor = createEditor();
    editor.setCamera({ x: 0, y: 0, zoom: 2 });
    editor.registerTool("hand", createHandTool);
    editor.setTool("hand");
    scriptPointer(editor, [down([100, 100]), move([140, 100]), up([140, 100])]);
    expect(editor.getCamera()).toEqual({ x: -20, y: 0, zoom: 2 });
  });

  it("shows the grabbing cursor during a drag", () => {
    const editor = createEditor();
    editor.registerTool("hand", createHandTool);
    editor.setTool("hand");
    scriptPointer(editor, [down([100, 100])]);
    expect(editor.getCursor()).toBe("grabbing");
    scriptPointer(editor, [up([100, 100])]);
    expect(editor.getCursor()).toBe("grab");
  });
});
