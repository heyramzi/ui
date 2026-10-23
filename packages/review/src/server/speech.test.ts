import { describe, expect, it } from "vite-plus/test";
import { parseAction } from "#src/server/guards.js";

const good = { type: "speech", source: "cam", start: 8, end: 14, text: "the line" };

describe("the speech action", () => {
  it("passes a stretch with typed words", () => {
    expect(parseAction(good)).toEqual(good);
  });
  it("refuses empty words, a backwards stretch and a time that isn't a number", () => {
    expect(parseAction({ ...good, text: "  " })).toBeNull();
    expect(parseAction({ ...good, start: 14, end: 8 })).toBeNull();
    expect(parseAction({ ...good, start: "8" })).toBeNull();
    expect(parseAction({ ...good, source: "" })).toBeNull();
  });
});
