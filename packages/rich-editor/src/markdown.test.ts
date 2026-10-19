import { describe, expect, it } from "vite-plus/test";
import { tiptapToMarkdown, markdownToTiptap } from "#src/markdown.js";
import { blocks, allHaveIds } from "#src/markdown-test-helpers.js";

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
