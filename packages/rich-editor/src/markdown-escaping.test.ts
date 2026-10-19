import { describe, expect, it } from "vite-plus/test";
import { tiptapToMarkdown, markdownToTiptap } from "#src/markdown.js";
import { blocks } from "#src/markdown-test-helpers.js";

// ---- snake_case / underscore correctness ----
// The reason the hand-rolled parser went: its regex read any single underscore
// as italic and mangled snake_case identifiers.
describe("snake_case and underscore safety", () => {
  it("clic_tempo_v2 survives round-trip as plain text with no italic marks", () => {
    const doc = markdownToTiptap("clic_tempo_v2");
    const para = blocks(doc)[0];
    // No node should carry an italic mark.
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
    // All content should be text nodes.
    const allText = para.content?.every((n) => n.type === "text");
    expect(allText).toBe(true);
    // The serialized markdown should not wrap content in emphasis delimiters.
    const out = tiptapToMarkdown(doc);
    expect(out).not.toContain("*clic");
    expect(out).not.toContain("_clic");
  });

  it("api_key_prod survives round-trip as plain text with no italic marks", () => {
    const doc = markdownToTiptap("api_key_prod");
    const para = blocks(doc)[0];
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
    const out = tiptapToMarkdown(doc);
    expect(out).not.toContain("*api");
    expect(out).not.toContain("_api");
  });

  it("snake_case_naming survives round-trip as plain text with no italic marks", () => {
    const doc = markdownToTiptap("snake_case_naming");
    const para = blocks(doc)[0];
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
  });

  it("plain URL with underscores stays literal", () => {
    const doc = markdownToTiptap("https://app.example.com/a_b_c");
    const para = blocks(doc)[0];
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
    // The URL text must be preserved.
    const fullText = para.content?.map((n) => n.text ?? "").join("") ?? "";
    expect(fullText).toContain("a_b_c");
  });

  it("link with underscore href parses to a single link mark with the full href", () => {
    const doc = markdownToTiptap("[docs](https://x.com/a_b_c)");
    const para = blocks(doc)[0];
    // Exactly one text node with a link mark.
    const linkNode = para.content?.find((n) => n.marks?.some((m) => m.type === "link"));
    expect(linkNode).toBeDefined();
    const linkMark = linkNode?.marks?.find((m) => m.type === "link");
    expect(linkMark?.attrs?.href).toBe("https://x.com/a_b_c");
    // No italic mark anywhere.
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
    // Round-trip: serialized form preserves the full href.
    const out = tiptapToMarkdown(doc);
    expect(out).toContain("(https://x.com/a_b_c)");
  });

  it("inline code protects underscores from italic parsing", () => {
    // Backtick content is never split on underscores.
    const doc = markdownToTiptap("Use `client_id` to auth");
    const para = blocks(doc)[0];
    const hasItalic = para.content?.some((n) => n.marks?.some((m) => m.type === "italic"));
    expect(hasItalic).toBe(false);
    const codeNode = para.content?.find((n) => n.marks?.some((m) => m.type === "code"));
    expect(codeNode?.text).toBe("client_id");
    // Round-trip preserves the backtick form.
    const out = tiptapToMarkdown(doc);
    expect(out).toContain("`client_id`");
  });
});

// ---- markdown character escaping ----
describe("markdown character escaping in serializer", () => {
  it("literal * in text is escaped on output and round-trips correctly", () => {
    // Build a doc with plain text that contains an asterisk.
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          attrs: { id: "a" },
          content: [{ type: "text", text: "price * 5" }],
        },
      ],
    };
    const out = tiptapToMarkdown(doc);
    // Output should escape the asterisk.
    expect(out).toContain("\\*");
    // Parsing the output must produce plain text with the literal asterisk.
    const doc2 = markdownToTiptap(out);
    const fullText =
      doc2.content[0]?.content?.map((n: { text?: string }) => n.text ?? "").join("") ?? "";
    expect(fullText).toBe("price * 5");
    // No bold/italic marks.
    const hasEmphasis = doc2.content[0]?.content?.some((n: { marks?: { type: string }[] }) =>
      n.marks?.some((m) => m.type === "bold" || m.type === "italic"),
    );
    expect(hasEmphasis).toBeFalsy();
  });

  it("literal _ in text is escaped on output and round-trips correctly", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          attrs: { id: "b" },
          content: [{ type: "text", text: "a_b" }],
        },
      ],
    };
    const out = tiptapToMarkdown(doc);
    expect(out).toContain("\\_");
    const doc2 = markdownToTiptap(out);
    const fullText =
      doc2.content[0]?.content?.map((n: { text?: string }) => n.text ?? "").join("") ?? "";
    expect(fullText).toBe("a_b");
  });

  it("literal backtick in text is escaped on output", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          attrs: { id: "c" },
          content: [{ type: "text", text: "use a `tick`" }],
        },
      ],
    };
    const out = tiptapToMarkdown(doc);
    expect(out).toContain("\\`");
  });

  it("literal [ in text is escaped on output", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph",
          attrs: { id: "d" },
          content: [{ type: "text", text: "not [a link]" }],
        },
      ],
    };
    const out = tiptapToMarkdown(doc);
    expect(out).toContain("\\[");
  });
});
