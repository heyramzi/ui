import { describe, expect, it } from "vitest";
import { screenToPage, type Camera } from "../core";
import {
  applyWheel,
  isHandledKey,
  isTextEntryTarget,
  modsOf,
  normalizePointerType,
  pointerInput,
  toScreen,
  toolForKey,
  wheelDelta,
  wheelZoomFactor,
  type KeyEventLike,
  type PointerEventLike,
  type WheelEventLike,
} from "./input";

function pointer(over: Partial<PointerEventLike> = {}): PointerEventLike {
  return {
    clientX: 0,
    clientY: 0,
    pressure: 0,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    pointerType: "mouse",
    detail: 1,
    button: 0,
    ...over,
  };
}

function wheel(over: Partial<WheelEventLike> = {}): WheelEventLike {
  return {
    clientX: 0,
    clientY: 0,
    deltaX: 0,
    deltaY: 0,
    deltaMode: 0,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...over,
  };
}

function key(over: Partial<KeyEventLike> = {}): KeyEventLike {
  return { key: "", shiftKey: false, altKey: false, metaKey: false, ctrlKey: false, ...over };
}

describe("normalizePointerType", () => {
  it("keeps pen and touch, and folds anything else to mouse", () => {
    expect(normalizePointerType("pen")).toBe("pen");
    expect(normalizePointerType("touch")).toBe("touch");
    expect(normalizePointerType("mouse")).toBe("mouse");
    expect(normalizePointerType("")).toBe("mouse");
  });
});

describe("pointerInput", () => {
  it("takes screen coordinates relative to the root's rect", () => {
    const input = pointerInput(pointer({ clientX: 30, clientY: 40 }), { left: 10, top: 10 });
    expect(input.screen).toEqual({ x: 20, y: 30 });
    expect(input.pointerType).toBe("mouse");
    expect(input.clicks).toBe(1);
  });

  it("forces mouse pressure to 0.5 and keeps a pen's own pressure", () => {
    expect(pointerInput(pointer({ pressure: 0 }), { left: 0, top: 0 }).pressure).toBe(0.5);
    expect(
      pointerInput(pointer({ pointerType: "pen", pressure: 0.7 }), { left: 0, top: 0 }).pressure
    ).toBe(0.7);
  });

  it("carries the modifier keys and the click count", () => {
    const input = pointerInput(
      pointer({ shiftKey: true, altKey: true, metaKey: true, detail: 2 }),
      { left: 0, top: 0 }
    );
    expect(input.shift).toBe(true);
    expect(input.alt).toBe(true);
    expect(input.meta).toBe(true);
    expect(input.clicks).toBe(2);
  });
});

describe("wheelDelta", () => {
  it("passes pixels through and scales lines and pages", () => {
    expect(wheelDelta(5, 0, 800)).toBe(5);
    expect(wheelDelta(2, 1, 800)).toBe(32);
    expect(wheelDelta(1, 2, 800)).toBe(800);
  });

  it("ignores a non-finite delta", () => {
    expect(wheelDelta(Number.NaN, 0, 800)).toBe(0);
  });
});

describe("wheelZoomFactor", () => {
  it("clamps a notch to a tenth", () => {
    expect(wheelZoomFactor(1000)).toBeCloseTo(1.1);
    expect(wheelZoomFactor(-1000)).toBeCloseTo(0.9);
  });
});

describe("applyWheel", () => {
  const camera: Camera = { x: 0, y: 0, zoom: 1 };

  it("pans on a plain wheel, following the fingers", () => {
    const next = applyWheel(camera, wheel({ deltaX: 10, deltaY: 20 }), { left: 0, top: 0 }, 800);
    expect(next).toEqual({ x: -10, y: -20, zoom: 1 });
  });

  it("zooms about the pointer on ctrl or meta", () => {
    const next = applyWheel(
      camera,
      wheel({ clientX: 100, clientY: 100, deltaY: 100, ctrlKey: true }),
      { left: 0, top: 0 },
      800
    );
    expect(next.zoom).toBeCloseTo(1.1);
    const page = screenToPage(camera, { x: 100, y: 100 });
    const after = screenToPage(next, { x: 100, y: 100 });
    expect(after.x).toBeCloseTo(page.x);
    expect(after.y).toBeCloseTo(page.y);
  });
});

describe("modsOf", () => {
  it("reads the three modifiers an editor tool sees", () => {
    expect(modsOf(key({ shiftKey: true, altKey: true, metaKey: true }))).toEqual({
      shift: true,
      alt: true,
      meta: true,
    });
  });
});

describe("toolForKey", () => {
  it("maps a letter to its tool, upper or lower case", () => {
    expect(toolForKey(key({ key: "v" }))).toBe("select");
    expect(toolForKey(key({ key: "V" }))).toBe("select");
    expect(toolForKey(key({ key: "e" }))).toBe("eraser");
  });

  it("never fires on an accel or alt chord, or a named key", () => {
    expect(toolForKey(key({ key: "z", metaKey: true }))).toBeNull();
    expect(toolForKey(key({ key: "z", ctrlKey: true }))).toBeNull();
    expect(toolForKey(key({ key: "v", altKey: true }))).toBeNull();
    expect(toolForKey(key({ key: "Escape" }))).toBeNull();
  });
});

describe("isTextEntryTarget", () => {
  it("is true for inputs, textareas and contenteditable", () => {
    expect(isTextEntryTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTextEntryTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isTextEntryTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("is false for other elements and for null", () => {
    expect(isTextEntryTarget({ tagName: "DIV" })).toBe(false);
    expect(isTextEntryTarget(null)).toBe(false);
  });
});

describe("isHandledKey", () => {
  it("claims the keys the editor acts on", () => {
    expect(isHandledKey(key({ key: " " }))).toBe(true);
    expect(isHandledKey(key({ key: "Delete" }))).toBe(true);
    expect(isHandledKey(key({ key: "ArrowLeft" }))).toBe(true);
    expect(isHandledKey(key({ key: "z", metaKey: true }))).toBe(true);
    expect(isHandledKey(key({ key: "r" }))).toBe(true);
  });

  it("leaves an unrelated key alone", () => {
    expect(isHandledKey(key({ key: "q" }))).toBe(false);
    expect(isHandledKey(key({ key: "F5" }))).toBe(false);
  });
});

describe("toScreen", () => {
  it("drops a page point onto the screen at the camera's zoom", () => {
    expect(toScreen({ x: 100, y: 50 }, { x: 20, y: 10, zoom: 2 })).toEqual({ x: 160, y: 80 });
  });
});
