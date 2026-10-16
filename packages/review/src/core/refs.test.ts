import { describe, expect, it } from "vitest";
import { findItem, insertRef, itemsFor, splitRefs, triggerAt } from "#src/core/refs.js";
import type { Shelf } from "#src/core/types.js";

const shelves: Shelf[] = [
  {
    id: "motion",
    label: "Motion",
    items: [
      { id: "pop-in", name: "Pop in", meta: "punchy" },
      { id: "slide", name: "Slide up" },
    ],
  },
  { id: "layout", label: "Layouts", items: [{ id: "split", name: "Screen and camera" }] },
  { id: "b-roll", label: "B-roll", items: [{ id: "desk", name: "Desk shot" }] },
];

describe("splitRefs", () => {
  it("cuts text around references", () => {
    expect(splitRefs("Use [motion: pop-in] here, then [layout: split].")).toEqual([
      { text: "Use " },
      { shelf: "motion", id: "pop-in" },
      { text: " here, then " },
      { shelf: "layout", id: "split" },
      { text: "." },
    ]);
  });
  it("leaves plain brackets alone", () => {
    expect(splitRefs("a [note] b")).toEqual([{ text: "a [note] b" }]);
  });
});

describe("triggerAt", () => {
  const at = (text: string) => triggerAt(text, text.length, shelves);
  it("opens every shelf on a bare @", () => {
    expect(at("Try @")).toEqual({ from: 4, shelves: ["motion", "layout", "b-roll"], query: "" });
  });
  it("filters all shelves on @word", () => {
    expect(at("@pop")?.query).toBe("pop");
  });
  it("opens one shelf on its name, hyphen or not", () => {
    expect(at("@motion sl")).toEqual({ from: 0, shelves: ["motion"], query: "sl" });
    expect(at("see /broll")).toEqual({ from: 4, shelves: ["b-roll"], query: "" });
  });
  it("opens shelves by prefix after a slash", () => {
    expect(at("/lay")?.shelves).toEqual(["layout"]);
    expect(at("/zzz")).toBeNull();
  });
  it("stays quiet mid-word and with no shelves", () => {
    expect(at("mail@x")).toBeNull();
    expect(triggerAt("@", 1, [])).toBeNull();
  });
});

describe("picking", () => {
  it("matches every query word and caps a mixed list", () => {
    const trigger = triggerAt("@motion up", 10, shelves)!;
    expect(itemsFor(shelves, trigger).map((p) => p.item.id)).toEqual(["slide"]);
    const many: Shelf[] = [
      {
        id: "a",
        label: "A",
        items: Array.from({ length: 30 }, (_, i) => ({ id: `i${i}`, name: `n${i}` })),
      },
      shelves[0]!,
    ];
    expect(itemsFor(many, triggerAt("@", 1, many)!).filter((p) => p.shelf.id === "a")).toHaveLength(
      12,
    );
  });
  it("writes the reference and moves the caret past it", () => {
    const text = "Use @motion pop then more";
    const caret = 15;
    const trigger = triggerAt(text, caret, shelves)!;
    const pick = itemsFor(shelves, trigger)[0]!;
    expect(insertRef(text, trigger, caret, pick)).toEqual({
      value: "Use [motion: pop-in]  then more",
      caret: 21,
    });
  });
  it("finds an item, or says it's gone", () => {
    expect(findItem(shelves, "layout", "split")?.item.name).toBe("Screen and camera");
    expect(findItem(shelves, "layout", "gone")).toBeUndefined();
  });
});
