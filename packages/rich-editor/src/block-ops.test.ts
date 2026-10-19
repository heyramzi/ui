import { describe, expect, it } from "vite-plus/test";
import {
  listBlocks,
  appendBlocks,
  prependBlocks,
  insertBlocksAfter,
  replaceBlock,
  deleteBlock,
} from "#src/block-ops.js";
import { markdownToTiptap } from "#src/markdown.js";

// Build a test doc from markdown so blocks carry real ids.
function makeDoc(md: string) {
  return markdownToTiptap(md);
}

// ---- listBlocks ----
describe("listBlocks", () => {
  it("returns one entry per top-level block", () => {
    const doc = makeDoc("# Heading\n\nParagraph.\n\n---");
    const list = listBlocks(doc);
    expect(list).toHaveLength(3);
  });

  it("each entry has id, type, text", () => {
    const doc = makeDoc("Hello world");
    const list = listBlocks(doc);
    expect(list[0].id).toBeTruthy();
    expect(list[0].type).toBe("paragraph");
    expect(list[0].text).toContain("Hello world");
  });

  it("id matches the block's attrs.id", () => {
    const doc = makeDoc("# Title\n\nBody");
    const list = listBlocks(doc);
    expect(list[0].id).toBe(doc.content[0].attrs?.id);
    expect(list[1].id).toBe(doc.content[1].attrs?.id);
  });

  it("truncates long text to 120 chars", () => {
    const longText = "x".repeat(200);
    const doc = makeDoc(longText);
    const list = listBlocks(doc);
    expect(list[0].text.length).toBeLessThanOrEqual(120);
  });
});

// ---- appendBlocks ----
describe("appendBlocks", () => {
  it("adds blocks at the end", () => {
    const doc = makeDoc("First block");
    const result = appendBlocks(doc, "Second block");
    expect(result.content).toHaveLength(2);
    const types = listBlocks(result).map((b) => b.text);
    expect(types[0]).toContain("First block");
    expect(types[1]).toContain("Second block");
  });

  it("does not mutate the input doc", () => {
    const doc = makeDoc("Original");
    const originalLen = doc.content.length;
    appendBlocks(doc, "Extra");
    expect(doc.content).toHaveLength(originalLen);
  });

  it("new blocks have ids", () => {
    const doc = makeDoc("First");
    const result = appendBlocks(doc, "Added paragraph");
    const newBlock = result.content[1];
    const newId = newBlock.attrs?.id;
    expect(typeof newId).toBe("string");
    expect(typeof newId === "string" && newId.length).toBeGreaterThan(0);
  });

  it("preserves existing block ids", () => {
    const doc = makeDoc("First");
    const originalId = doc.content[0].attrs?.id;
    const result = appendBlocks(doc, "Extra");
    expect(result.content[0].attrs?.id).toBe(originalId);
  });
});

// ---- prependBlocks ----
describe("prependBlocks", () => {
  it("adds blocks at the beginning", () => {
    const doc = makeDoc("Second");
    const result = prependBlocks(doc, "First");
    expect(result.content).toHaveLength(2);
    expect(listBlocks(result)[0].text).toContain("First");
    expect(listBlocks(result)[1].text).toContain("Second");
  });

  it("does not mutate the input doc", () => {
    const doc = makeDoc("Original");
    const originalLen = doc.content.length;
    prependBlocks(doc, "New first");
    expect(doc.content).toHaveLength(originalLen);
  });

  it("new blocks have ids", () => {
    const doc = makeDoc("Existing");
    const result = prependBlocks(doc, "Prepended");
    expect(typeof result.content[0].attrs?.id).toBe("string");
  });

  it("preserves existing block ids", () => {
    const doc = makeDoc("Existing");
    const existingId = doc.content[0].attrs?.id;
    const result = prependBlocks(doc, "Prepended");
    expect(result.content[1].attrs?.id).toBe(existingId);
  });
});

// ---- insertBlocksAfter ----
describe("insertBlocksAfter", () => {
  it("inserts after the correct block", () => {
    const doc = makeDoc("# First\n\n## Second\n\n### Third");
    const secondId = doc.content[1].attrs?.id as string;
    const result = insertBlocksAfter(doc, secondId, "Inserted");
    expect(result.content).toHaveLength(4);
    expect(listBlocks(result)[2].text).toContain("Inserted");
  });

  it("inserts at the end when afterId is the last block", () => {
    const doc = makeDoc("A\n\nB");
    const lastId = doc.content[1].attrs?.id as string;
    const result = insertBlocksAfter(doc, lastId, "C");
    expect(result.content).toHaveLength(3);
    expect(listBlocks(result)[2].text).toContain("C");
  });

  it("throws for unknown id", () => {
    const doc = makeDoc("Block");
    expect(() => insertBlocksAfter(doc, "nonexistent-id", "new")).toThrow(/nonexistent-id/);
  });

  it("does not mutate the input doc", () => {
    const doc = makeDoc("A\n\nB");
    const firstId = doc.content[0].attrs?.id as string;
    const originalLen = doc.content.length;
    insertBlocksAfter(doc, firstId, "C");
    expect(doc.content).toHaveLength(originalLen);
  });

  it("new blocks have ids", () => {
    const doc = makeDoc("A");
    const firstId = doc.content[0].attrs?.id as string;
    const result = insertBlocksAfter(doc, firstId, "B");
    expect(typeof result.content[1].attrs?.id).toBe("string");
  });
});

// ---- replaceBlock ----
describe("replaceBlock", () => {
  it("replaces the target block", () => {
    const doc = makeDoc("# Old heading\n\nOther");
    const headingId = doc.content[0].attrs?.id as string;
    const result = replaceBlock(doc, headingId, "# New heading");
    expect(result.content).toHaveLength(2);
    const summary = listBlocks(result);
    expect(summary[0].text).toContain("New heading");
    expect(summary[1].text).toContain("Other");
  });

  it("throws for unknown id", () => {
    const doc = makeDoc("Block");
    expect(() => replaceBlock(doc, "no-such-id", "replacement")).toThrow(/no-such-id/);
  });

  it("does not mutate the input doc", () => {
    const doc = makeDoc("Original");
    const id = doc.content[0].attrs?.id as string;
    const originalText = listBlocks(doc)[0].text;
    replaceBlock(doc, id, "Replaced");
    expect(listBlocks(doc)[0].text).toBe(originalText);
  });

  it("replacement blocks have fresh ids", () => {
    const doc = makeDoc("Old");
    const id = doc.content[0].attrs?.id as string;
    const result = replaceBlock(doc, id, "New");
    const newId = result.content[0].attrs?.id;
    expect(typeof newId).toBe("string");
    // Replacement block gets a fresh id, not the old one.
    expect(newId).not.toBe(id);
  });

  it("can replace one block with multiple blocks", () => {
    const doc = makeDoc("# Heading\n\nPara");
    const headingId = doc.content[0].attrs?.id as string;
    const result = replaceBlock(doc, headingId, "# A\n\n# B");
    expect(result.content).toHaveLength(3);
  });
});

// ---- deleteBlock ----
describe("deleteBlock", () => {
  it("removes the target block", () => {
    const doc = makeDoc("A\n\nB\n\nC");
    const bId = doc.content[1].attrs?.id as string;
    const result = deleteBlock(doc, bId);
    expect(result.content).toHaveLength(2);
    expect(listBlocks(result).map((b) => b.text)).not.toContain("B");
  });

  it("throws for unknown id", () => {
    const doc = makeDoc("Block");
    expect(() => deleteBlock(doc, "ghost-id")).toThrow(/ghost-id/);
  });

  it("does not mutate the input doc", () => {
    const doc = makeDoc("A\n\nB");
    const originalLen = doc.content.length;
    const firstId = doc.content[0].attrs?.id as string;
    deleteBlock(doc, firstId);
    expect(doc.content).toHaveLength(originalLen);
  });

  it("preserves ids of remaining blocks", () => {
    const doc = makeDoc("A\n\nB\n\nC");
    const ids = doc.content.map((n) => n.attrs?.id as string);
    const result = deleteBlock(doc, ids[1]);
    expect(result.content[0].attrs?.id).toBe(ids[0]);
    expect(result.content[1].attrs?.id).toBe(ids[2]);
  });
});

// ---- invalid doc ----
describe("invalid doc input", () => {
  it("listBlocks throws on null", () => {
    expect(() => listBlocks(null)).toThrow();
  });

  it("listBlocks throws on non-doc object", () => {
    expect(() => listBlocks({ type: "paragraph" })).toThrow();
  });
});
