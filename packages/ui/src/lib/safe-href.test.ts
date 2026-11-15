import { describe, expect, it } from "vite-plus/test";
import { safeHref } from "#src/lib/safe-href.js";

describe("safeHref", () => {
  it.each([
    "/clients/42",
    "#notes",
    "https://example.com/a?b=1",
    "mailto:hi@example.com",
    "tel:+33123456789",
    "descript://project/abc",
  ])("keeps %s, which runs no script", (href) => {
    expect(safeHref(href)).toBe(href);
  });

  // The record url finding's payload, and the spellings the URL parser reads as the same scheme.
  it.each([
    "javascript:alert(document.domain)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "vbscript:msgbox(1)",
  ])("drops %j, which runs script when followed", (href) => {
    expect(safeHref(href)).toBeUndefined();
  });

  it("treats a missing href as no link", () => {
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref("")).toBeUndefined();
  });
});
