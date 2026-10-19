import { describe, expect, it } from "vite-plus/test";
import { tiptapToMarkdown, markdownToTiptap } from "#src/markdown.js";
import { blocks, allHaveIds } from "#src/markdown-test-helpers.js";

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
