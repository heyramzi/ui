import { describe, expect, it } from "vite-plus/test";
import { tiptapToMarkdown, markdownToTiptap } from "./markdown.js";

// Helper: extract top-level block nodes from a doc.
function blocks(doc: ReturnType<typeof markdownToTiptap>) {
  return doc.content;
}

// Helper: all top-level blocks carry a string id.
function allHaveIds(doc: ReturnType<typeof markdownToTiptap>) {
  return doc.content.every((n) => typeof n.attrs?.id === "string" && n.attrs.id.length > 0);
}

// ---- paragraph ----
describe("paragraph", () => {
  it("round-trips a plain paragraph", () => {
    const md = "Hello world";
    const doc = markdownToTiptap(md);
    expect(tiptapToMarkdown(doc)).toBe(md);
  });

  it("stamps a block id on paragraphs", () => {
    const doc = markdownToTiptap("Some text");
    expect(allHaveIds(doc)).toBe(true);
  });
});

// ---- headings ----
describe("headings", () => {
  it("round-trips h1", () => {
    const md = "# Title";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });

  it("round-trips h2", () => {
    const md = "## Section";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });

  it("round-trips h3", () => {
    const md = "### Subsection";
    expect(tiptapToMarkdown(markdownToTiptap(md))).toBe(md);
  });

  it("produces correct heading node type and level", () => {
    const doc = markdownToTiptap("## Hello");
    expect(blocks(doc)[0].type).toBe("heading");
    expect(blocks(doc)[0].attrs?.level).toBe(2);
  });

  it("stamps ids on headings", () => {
    const doc = markdownToTiptap("# Title\n\n## Section");
    expect(allHaveIds(doc)).toBe(true);
  });
});

// ---- horizontal rule ----
describe("horizontal rule", () => {
  it("round-trips an hr", () => {
    const md = "Before\n\n---\n\nAfter";
    const doc = markdownToTiptap(md);
    const md2 = tiptapToMarkdown(doc);
    expect(md2).toContain("---");
    expect(md2).toContain("Before");
    expect(md2).toContain("After");
  });

  it("produces horizontalRule node", () => {
    const doc = markdownToTiptap("---");
    expect(blocks(doc)[0].type).toBe("horizontalRule");
  });
});

// ---- bullet list ----
describe("bulletList", () => {
  it("round-trips a flat bullet list", () => {
    const md = "- Alpha\n- Beta\n- Gamma";
    const doc = markdownToTiptap(md);
    const result = tiptapToMarkdown(doc);
    expect(result).toContain("Alpha");
    expect(result).toContain("Beta");
    expect(result).toContain("Gamma");
  });

  it("produces bulletList node with listItems", () => {
    const doc = markdownToTiptap("- One\n- Two");
    const list = blocks(doc)[0];
    expect(list.type).toBe("bulletList");
    expect(list.content?.length).toBe(2);
    expect(list.content?.[0].type).toBe("listItem");
  });

  it("handles nested bullet lists", () => {
    const md = "- Parent\n  - Child\n  - Child2";
    const doc = markdownToTiptap(md);
    const list = blocks(doc)[0];
    expect(list.type).toBe("bulletList");
    // Parent item content should contain a nested list.
    const parentItem = list.content?.[0];
    expect(parentItem?.content?.some((n) => n.type === "bulletList")).toBe(true);
  });
});

// ---- ordered list ----
describe("orderedList", () => {
  it("round-trips a numbered list", () => {
    const md = "1. First\n2. Second\n3. Third";
    const doc = markdownToTiptap(md);
    const result = tiptapToMarkdown(doc);
    expect(result).toContain("First");
    expect(result).toContain("Second");
    expect(result).toContain("Third");
  });

  it("produces orderedList node", () => {
    const doc = markdownToTiptap("1. One\n2. Two");
    expect(blocks(doc)[0].type).toBe("orderedList");
  });
});

// ---- blockquote ----
describe("blockquote", () => {
  it("round-trips a blockquote", () => {
    const md = "> This is a quote";
    const doc = markdownToTiptap(md);
    const result = tiptapToMarkdown(doc);
    expect(result).toContain("> This is a quote");
  });

  it("produces blockquote node", () => {
    const doc = markdownToTiptap("> Quote");
    expect(blocks(doc)[0].type).toBe("blockquote");
  });
});

// ---- codeBlock ----
describe("codeBlock", () => {
  it("round-trips a fenced code block", () => {
    const md = "```js\nconsole.log('hi');\n```";
    const doc = markdownToTiptap(md);
    const result = tiptapToMarkdown(doc);
    expect(result).toBe(md);
  });

  it("round-trips a code block without language", () => {
    const md = "```\nsome code\n```";
    const doc = markdownToTiptap(md);
    const result = tiptapToMarkdown(doc);
    expect(result).toBe(md);
  });

  it("produces codeBlock node with language attr", () => {
    const doc = markdownToTiptap("```typescript\nconst x = 1;\n```");
    const node = blocks(doc)[0];
    expect(node.type).toBe("codeBlock");
    expect(node.attrs?.language).toBe("typescript");
  });
});

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

// ---- multi-block round-trip ----
describe("multi-block round-trips", () => {
  it("handles heading + paragraph + hr", () => {
    const md = "# Hello\n\nSome paragraph.\n\n---";
    const doc = markdownToTiptap(md);
    const result = tiptapToMarkdown(doc);
    expect(result).toContain("# Hello");
    expect(result).toContain("Some paragraph.");
    expect(result).toContain("---");
  });

  it("gives each block a unique id", () => {
    const doc = markdownToTiptap("# H\n\nParagraph.\n\n---");
    const ids = doc.content.map((n) => n.attrs?.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("stable: MD -> JSON -> MD produces the same markdown structure", () => {
    const md = "## Title\n\nFirst para.\n\n- A\n- B\n\n> Quote\n\n```\ncode\n```";
    const doc = markdownToTiptap(md);
    const md2 = tiptapToMarkdown(doc);
    const doc2 = markdownToTiptap(md2);
    // Structure should match (ignore ids which are freshly generated each time).
    const stripIds = (n: Record<string, unknown>): unknown => {
      const { attrs, content, ...rest } = n;
      return {
        ...rest,
        ...(attrs
          ? {
              attrs: Object.fromEntries(
                Object.entries(attrs as Record<string, unknown>).filter(([k]) => k !== "id"),
              ),
            }
          : {}),
        ...(Array.isArray(content)
          ? { content: (content as Record<string, unknown>[]).map(stripIds) }
          : {}),
      };
    };
    const stripped1 = doc.content.map(stripIds);
    const stripped2 = doc2.content.map(stripIds);
    expect(stripped1).toEqual(stripped2);
  });
});

// ---- JSON -> markdown expected output ----
describe("tiptapToMarkdown expected output", () => {
  it("serializes a doc with heading, paragraph, list, hr", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "heading",
          attrs: { level: 2, id: "x" },
          content: [{ type: "text", text: "Section" }],
        },
        { type: "paragraph", attrs: { id: "y" }, content: [{ type: "text", text: "Body text." }] },
        {
          type: "bulletList",
          attrs: { id: "z" },
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }],
            },
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Item 2" }] }],
            },
          ],
        },
        { type: "horizontalRule", attrs: { id: "w" } },
      ],
    };
    const md = tiptapToMarkdown(doc);
    expect(md).toContain("## Section");
    expect(md).toContain("Body text.");
    expect(md).toContain("- Item 1");
    expect(md).toContain("- Item 2");
    expect(md).toContain("---");
  });

  it("images are dropped silently", () => {
    const doc = {
      type: "doc" as const,
      content: [
        { type: "image", attrs: { src: "https://x.com/img.png", id: "a" } },
        {
          type: "paragraph",
          attrs: { id: "b" },
          content: [{ type: "text", text: "After image." }],
        },
      ],
    };
    const md = tiptapToMarkdown(doc);
    expect(md).not.toContain("img.png");
    expect(md).toContain("After image.");
  });
});

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

// ---- youtube node ----
describe("youtube node", () => {
  const ID = "dQw4w9WgXcQ";

  it("converts a standalone youtube.com/watch image into a youtube node", () => {
    const doc = markdownToTiptap(`![How to build a CRM](https://www.youtube.com/watch?v=${ID})`);
    const node = blocks(doc)[0];
    expect(node.type).toBe("youtube");
    expect(node.attrs?.videoId).toBe(ID);
    expect(node.attrs?.start).toBe(0);
  });

  it("converts a standalone youtu.be image into a youtube node", () => {
    const doc = markdownToTiptap(`![Short link](https://youtu.be/${ID})`);
    const node = blocks(doc)[0];
    expect(node.type).toBe("youtube");
    expect(node.attrs?.videoId).toBe(ID);
  });

  it("converts a standalone youtube.com/embed image into a youtube node", () => {
    const doc = markdownToTiptap(`![Embed link](https://www.youtube.com/embed/${ID})`);
    const node = blocks(doc)[0];
    expect(node.type).toBe("youtube");
    expect(node.attrs?.videoId).toBe(ID);
  });

  it("maps a ?t= start parameter to attrs.start", () => {
    const doc = markdownToTiptap(`![Title](https://www.youtube.com/watch?v=${ID}&t=90)`);
    expect(blocks(doc)[0].attrs?.start).toBe(90);
  });

  it("maps a youtu.be ?t= start parameter to attrs.start", () => {
    const doc = markdownToTiptap(`![Title](https://youtu.be/${ID}?t=45)`);
    expect(blocks(doc)[0].attrs?.start).toBe(45);
  });

  it("alt text becomes the title", () => {
    const doc = markdownToTiptap(`![How to build a Acme CRM](https://youtu.be/${ID})`);
    expect(blocks(doc)[0].attrs?.title).toBe("How to build a Acme CRM");
  });

  it("stamps a block id on the youtube node like other top-level blocks", () => {
    const doc = markdownToTiptap(`![Title](https://youtu.be/${ID})`);
    expect(allHaveIds(doc)).toBe(true);
  });

  it("leaves a non-YouTube image alone (out of scope, dropped as before)", () => {
    const doc = markdownToTiptap("![A photo](https://example.com/photo.png)");
    expect(blocks(doc)[0].type).toBe("paragraph");
  });

  it("round-trips: JSON -> markdown -> JSON keeps the same videoId, title and start", () => {
    const doc = markdownToTiptap(
      `![How to build a CRM](https://www.youtube.com/watch?v=${ID}&t=90)`,
    );
    const md = tiptapToMarkdown(doc);
    const doc2 = markdownToTiptap(md);
    expect(doc2.content[0].type).toBe("youtube");
    expect(doc2.content[0].attrs?.videoId).toBe(ID);
    expect(doc2.content[0].attrs?.title).toBe("How to build a CRM");
    expect(doc2.content[0].attrs?.start).toBe(90);
  });

  it("serializes a youtube node back to an image markdown line", () => {
    const doc = {
      type: "doc" as const,
      content: [{ type: "youtube", attrs: { videoId: ID, title: "My Video", start: 0, id: "a" } }],
    };
    const md = tiptapToMarkdown(doc);
    expect(md).toBe(`![My Video](https://www.youtube.com/watch?v=${ID})`);
  });

  it("serializes a non-zero start as &t=", () => {
    const doc = {
      type: "doc" as const,
      content: [{ type: "youtube", attrs: { videoId: ID, title: "My Video", start: 90, id: "a" } }],
    };
    const md = tiptapToMarkdown(doc);
    expect(md).toBe(`![My Video](https://www.youtube.com/watch?v=${ID}&t=90)`);
  });

  it("serializes nothing for an invalid videoId", () => {
    const doc = {
      type: "doc" as const,
      content: [{ type: "youtube", attrs: { videoId: "bad", title: "T", id: "a" } }],
    };
    expect(tiptapToMarkdown(doc)).toBe("");
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
