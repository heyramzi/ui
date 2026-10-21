import { describe, expect, it } from "vite-plus/test";
import { hasLink, linkify } from "#src/canvas/headless/linkify.js";

describe("linkify", () => {
  it("splits a link out of a line and leaves the words around it", () => {
    expect(linkify("OPEN: the board, https://app.example.com/1/v/b/2 then go")).toEqual([
      { text: "OPEN: the board, " },
      { text: "https://app.example.com/1/v/b/2", href: "https://app.example.com/1/v/b/2" },
      { text: " then go" },
    ]);
  });

  it("keeps sentence punctuation out of the link", () => {
    const parts = linkify("See https://example.com/a.");
    expect(parts[1].href).toBe("https://example.com/a");
    expect(parts[2].text).toBe(".");
  });

  it("returns plain text as one part", () => {
    expect(linkify("no link here")).toEqual([{ text: "no link here" }]);
    expect(hasLink("no link here")).toBe(false);
  });
});
