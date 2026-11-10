import { describe, expect, it } from "vite-plus/test";
import { penNodeName } from "#src/canvas/pen/node-name.svelte.js";
import { resolveToolKey } from "#src/canvas/ui/tools.js";

function keyOn(target: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  let seen: KeyboardEvent | null = null;
  target.addEventListener("keydown", (e) => (seen = e), { once: true });
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  if (!seen) throw new Error("no event");
  return seen;
}

describe("resolveToolKey", () => {
  const pane = document.createElement("div");
  const field = document.createElement("textarea");

  it("picks the tool the tooltip letter names", () => {
    expect(resolveToolKey(keyOn(pane, "p"))).toBe("pen");
    expect(resolveToolKey(keyOn(pane, "V"))).toBe("select");
    expect(resolveToolKey(keyOn(pane, "r"))).toBe("rectangle");
  });

  it("leaves letters alone while typing, and chords to their own shortcuts", () => {
    expect(resolveToolKey(keyOn(field, "p"))).toBeNull();
    expect(resolveToolKey(keyOn(pane, "v", { metaKey: true }))).toBeNull();
    expect(resolveToolKey(keyOn(pane, "L", { shiftKey: true }))).toBeNull();
    expect(resolveToolKey(keyOn(pane, "q"))).toBeNull();
  });
});

describe("penNodeName", () => {
  it("names a node by its words, and by its kind when it has none", () => {
    expect(penNodeName("text", { text: "  Draw on me " })).toBe("Draw on me");
    expect(penNodeName("text", { text: "" })).toBe("Empty text");
    expect(penNodeName("shape", { shape: "ellipse", label: "Ship" })).toBe("Ellipse: Ship");
    expect(penNodeName("shape", { shape: "diamond", label: "" })).toBe("Diamond");
    expect(penNodeName("stroke", { tool: "highlighter" })).toBe("Highlighter stroke");
  });
});
