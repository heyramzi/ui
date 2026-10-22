import { describe, expect, it } from "vite-plus/test";
import {
  addTag,
  canCreate,
  cleanTags,
  collectOptions,
  editDistance,
  matchOptions,
  removeTag,
  splitTags,
} from "#src/components/tags-input/tags.js";

const options = ["Airtable", "Docusign", "QuickBooks", "SharePoint", "Supabase"];

describe("tags as labels", () => {
  it("splits on commas and newlines", () => {
    expect(splitTags(" a, b,,\nc ,")).toEqual(["a", "b", "c"]);
  });

  it("counts a transposition as one edit", () => {
    expect(editDistance("airtbale", "airtable")).toBe(1);
    expect(editDistance("make", "airtable")).toBeGreaterThan(2);
  });

  it("picks the option's spelling for a case or spacing difference", () => {
    expect(addTag([], "airtable", options)).toEqual(["Airtable"]);
    expect(addTag([], "share point", options)).toEqual(["SharePoint"]);
    const held = ["Airtable"];
    expect(addTag(held, "AIRTABLE", options)).toBe(held);
  });

  it("puts a near miss first and never offers a held option", () => {
    expect(matchOptions(options, [], "Airtabel")[0]).toBe("Airtable");
    expect(matchOptions(options, ["Airtable"], "airtable")).toEqual([]);
    expect(matchOptions(options, [], "su")).toEqual(["Supabase"]);
  });

  it("ranks the same word, a prefix, then a part", () => {
    expect(matchOptions(["QuickBooks", "Books", "Booksy"], [], "books")).toEqual([
      "Books",
      "Booksy",
      "QuickBooks",
    ]);
  });

  it("offers create only for a new word, and only when allowed", () => {
    expect(canCreate(options, [], "airtable")).toBe(false);
    expect(canCreate(options, [], "Airtabel")).toBe(true);
    expect(canCreate(options, [], "Make", false)).toBe(false);
  });

  it("stops at max and removes by any casing", () => {
    expect(addTag(["a", "b"], "c", [], 2)).toEqual(["a", "b"]);
    expect(removeTag(["Airtable"], "airtable")).toEqual([]);
  });

  it("collapses a stored list and collects the most used spelling", () => {
    expect(cleanTags(["docusign", "Docusign"], options)).toEqual(["Docusign"]);
    expect(collectOptions([["Quickbooks"], ["QuickBooks", "Docusign"], ["QuickBooks"]])).toEqual([
      "Docusign",
      "QuickBooks",
    ]);
  });
});
