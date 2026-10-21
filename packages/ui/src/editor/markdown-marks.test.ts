import { describe, expect, it } from "vite-plus/test";
import { tiptapToMarkdown, markdownToTiptap } from "#src/editor/markdown.js";
import { blocks } from "#src/editor/markdown-test-helpers.js";

// ---- marks: bold ----
describe("bold mark", () => {
  it("round-trips bold text", () => {
    const md = "Hello **world** text";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });

  it("produces bold mark on the right text node", () => {
    const doc = markdownToTiptap("**bold**");
    const para = blocks(doc)[0];
    const boldNode = para.content?.find((n) => n.marks?.some((m) => m.type === "bold"));
    expect(boldNode?.text).toBe("bold");
  });
});

// ---- marks: italic ----
describe("italic mark", () => {
  it("parses _italic_ and serializes as *italic*", () => {
    // WHY: italic parses from _ or *, but we always write *. Underscore emphasis
    // has word-boundary rules that would corrupt identifiers.
    const md = "Some _italic_ word";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe("Some *italic* word");
  });

  it("round-trips *italic* (asterisk form)", () => {
    const md = "Some *italic* word";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });
});

// ---- marks: strike ----
describe("strike mark", () => {
  it("round-trips strikethrough text", () => {
    const md = "Some ~~struck~~ text";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });
});

// ---- marks: inline code ----
describe("inline code mark", () => {
  it("round-trips inline code", () => {
    const md = "Use `console.log()` to debug";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });
});

// ---- marks: link ----
describe("link mark", () => {
  it("round-trips a link", () => {
    const md = "Visit [example](https://example.com) now";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });

  it("produces link mark with href attr", () => {
    const doc = markdownToTiptap("[click](https://example.com)");
    const para = blocks(doc)[0];
    const linkNode = para.content?.find((n) => n.marks?.some((m) => m.type === "link"));
    const linkMark = linkNode?.marks?.find((m) => m.type === "link");
    expect(linkMark?.attrs?.href).toBe("https://example.com");
  });
});

// ---- italic parsing: both forms ----
describe("italic parsing: both * and _ forms", () => {
  it("*italic* parses to italic mark", () => {
    const doc = markdownToTiptap("*italic*");
    const para = blocks(doc)[0];
    const italicNode = para.content?.find((n) => n.marks?.some((m) => m.type === "italic"));
    expect(italicNode?.text).toBe("italic");
  });

  it("_italic_ (word-boundary) parses to italic mark", () => {
    const doc = markdownToTiptap("_italic_");
    const para = blocks(doc)[0];
    const italicNode = para.content?.find((n) => n.marks?.some((m) => m.type === "italic"));
    expect(italicNode?.text).toBe("italic");
  });

  it("intraword underscores (clic_tempo) are NOT parsed as italic", () => {
    const doc = markdownToTiptap("clic_tempo");
    const para = blocks(doc)[0];
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
  });
});
