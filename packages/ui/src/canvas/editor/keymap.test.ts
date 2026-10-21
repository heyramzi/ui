import { describe, expect, it } from "vite-plus/test";
import {
  resolveEditorKeyAction,
  resolveNudge,
  isEditingTarget,
  isPanActivationKey,
} from "#src/canvas/editor/keymap.js";

function press(
  key: string,
  opts: { meta?: boolean; shift?: boolean; editing?: boolean } = {},
): KeyboardEvent {
  const target = opts.editing ? { tagName: "INPUT" } : { tagName: "DIV" };
  return {
    key,
    metaKey: opts.meta ?? false,
    ctrlKey: false,
    shiftKey: opts.shift ?? false,
    target,
  } as unknown as KeyboardEvent;
}

describe("resolveEditorKeyAction", () => {
  it("maps the undo and redo chords", () => {
    expect(resolveEditorKeyAction(press("z", { meta: true }), false)).toBe("undo");
    expect(resolveEditorKeyAction(press("z", { meta: true, shift: true }), false)).toBe("redo");
    expect(resolveEditorKeyAction(press("y", { meta: true }), false)).toBe("redo");
  });

  it("maps the clipboard chords, and leaves them to a field being typed in", () => {
    expect(resolveEditorKeyAction(press("c", { meta: true }), false)).toBe("copy");
    expect(resolveEditorKeyAction(press("v", { meta: true }), false)).toBe("paste");
    expect(resolveEditorKeyAction(press("a", { meta: true }), false)).toBe("select-all");
    expect(resolveEditorKeyAction(press("c", { meta: true, editing: true }), false)).toBeNull();
    expect(resolveEditorKeyAction(press("a", { meta: true, editing: true }), false)).toBeNull();
  });

  it("saves whatever has focus", () => {
    expect(resolveEditorKeyAction(press("s", { meta: true }), false)).toBe("save");
    expect(resolveEditorKeyAction(press("s", { meta: true, editing: true }), false)).toBe("save");
  });

  it("deletes only with a selection, and never while typing", () => {
    expect(resolveEditorKeyAction(press("Delete"), true)).toBe("delete");
    expect(resolveEditorKeyAction(press("Backspace"), true)).toBe("delete");
    expect(resolveEditorKeyAction(press("Delete"), false)).toBeNull();
    expect(resolveEditorKeyAction(press("Backspace", { editing: true }), true)).toBeNull();
  });

  it("claims nothing else", () => {
    expect(resolveEditorKeyAction(press("Tab"), true)).toBeNull();
    expect(resolveEditorKeyAction(press("k"), true)).toBeNull();
    expect(resolveEditorKeyAction(press("b", { meta: true }), true)).toBeNull();
  });
});

describe("isEditingTarget", () => {
  it("names the elements that own their own keys", () => {
    expect(isEditingTarget({ tagName: "INPUT" } as unknown as EventTarget)).toBe(true);
    expect(isEditingTarget({ tagName: "TEXTAREA" } as unknown as EventTarget)).toBe(true);
    expect(
      isEditingTarget({ tagName: "DIV", isContentEditable: true } as unknown as EventTarget),
    ).toBe(true);
    expect(isEditingTarget({ tagName: "DIV" } as unknown as EventTarget)).toBe(false);
    expect(isEditingTarget(null)).toBe(false);
  });
});

describe("isPanActivationKey", () => {
  function space(
    target: Record<string, unknown> = { tagName: "DIV" },
    mods: { meta?: boolean; ctrl?: boolean; alt?: boolean } = {},
  ): KeyboardEvent {
    return {
      code: "Space",
      key: " ",
      metaKey: mods.meta ?? false,
      ctrlKey: mods.ctrl ?? false,
      altKey: mods.alt ?? false,
      target: { getAttribute: () => null, ...target },
    } as unknown as KeyboardEvent;
  }

  it("is the hand tool over the canvas", () => {
    expect(isPanActivationKey(space())).toBe(true);
  });

  it("leaves space to a field being typed in", () => {
    expect(isPanActivationKey(space({ tagName: "TEXTAREA" }))).toBe(false);
    expect(isPanActivationKey(space({ tagName: "DIV", isContentEditable: true }))).toBe(false);
  });

  it("leaves space to a control that activates on it", () => {
    expect(isPanActivationKey(space({ tagName: "BUTTON" }))).toBe(false);
    expect(isPanActivationKey(space({ tagName: "DIV", getAttribute: () => "button" }))).toBe(false);
  });

  it("claims no other key, and no chord", () => {
    expect(isPanActivationKey({ code: "KeyS", key: "s" } as KeyboardEvent)).toBe(false);
    expect(isPanActivationKey(space({ tagName: "DIV" }, { meta: true }))).toBe(false);
  });
});

describe("the editor chords and zoom keys", () => {
  const code = (key: string, codeName: string, shift = false) =>
    ({
      key,
      code: codeName,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: shift,
      target: { tagName: "DIV" },
    }) as unknown as KeyboardEvent;

  it("maps duplicate, group and ungroup", () => {
    expect(resolveEditorKeyAction(press("d", { meta: true }), false)).toBe("duplicate");
    expect(resolveEditorKeyAction(press("g", { meta: true }), false)).toBe("group");
    expect(resolveEditorKeyAction(press("g", { meta: true, shift: true }), false)).toBe("ungroup");
    expect(resolveEditorKeyAction(press("d", { meta: true, editing: true }), false)).toBeNull();
  });

  it("maps chord and plain zoom", () => {
    expect(resolveEditorKeyAction(press("=", { meta: true }), false)).toBe("zoom-in");
    expect(resolveEditorKeyAction(press("-", { meta: true }), false)).toBe("zoom-out");
    expect(resolveEditorKeyAction(code("+", "Equal", true), false)).toBe("zoom-in");
    expect(resolveEditorKeyAction(code("-", "Minus"), false)).toBe("zoom-out");
  });

  it("maps Shift with 0, 1 and 2 by key code", () => {
    expect(resolveEditorKeyAction(code(")", "Digit0", true), false)).toBe("zoom-100");
    expect(resolveEditorKeyAction(code("!", "Digit1", true), false)).toBe("zoom-fit");
    expect(resolveEditorKeyAction(code("@", "Digit2", true), false)).toBe("zoom-selection");
  });

  it("stays out of a field being typed in", () => {
    expect(resolveEditorKeyAction(press("-", { editing: true }), false)).toBeNull();
  });
});

describe("resolveNudge", () => {
  const arrow = (key: string, shift = false, editing = false) =>
    ({
      key,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: shift,
      target: { tagName: editing ? "TEXTAREA" : "DIV" },
    }) as unknown as KeyboardEvent;

  it("moves 1px, or 10px with Shift", () => {
    expect(resolveNudge(arrow("ArrowLeft"))).toEqual({ dx: -1, dy: 0 });
    expect(resolveNudge(arrow("ArrowDown", true))).toEqual({ dx: 0, dy: 10 });
  });

  it("ignores other keys and fields", () => {
    expect(resolveNudge(arrow("a"))).toBeNull();
    expect(resolveNudge(arrow("ArrowUp", false, true))).toBeNull();
  });
});
