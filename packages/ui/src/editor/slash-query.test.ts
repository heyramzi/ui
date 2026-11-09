import { describe, expect, it } from "vite-plus/test";
import { slashQueryAt } from "#src/editor/slash-query.js";

describe("slashQueryAt", () => {
  it.each([
    ["/", ""],
    ["/head", "head"],
    ["hello /bul", "bul"],
    ["line one\n/", ""],
    ["TCP/IP", null],
    ["and/or", null],
    ["src/lib", null],
    ["https://example", null],
    [`x/${"a".repeat(20)}`, null],
    ["no slash here", null],
  ])("reads %j as %j", (textBefore, expected) => {
    expect(slashQueryAt(textBefore)).toBe(expected);
  });
});
