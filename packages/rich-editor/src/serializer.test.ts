import { describe, expect, it } from "vite-plus/test";
import { renderTiptapContent } from "#src/serializer.js";

function row(...cells: string[]) {
  return {
    type: "tableRow",
    content: cells.map((text) => ({
      type: "tableCell",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    })),
  };
}

function table(...rows: ReturnType<typeof row>[]) {
  return { type: "doc", content: [{ type: "table", content: rows }] };
}

describe("renderTiptapContent", () => {
  it("silently drops unknown cmsBlock nodes", () => {
    const html = renderTiptapContent({
      type: "doc",
      content: [
        {
          type: "cmsBlock",
          attrs: { blockType: "mediaBlock", data: { media: 1117 } },
        },
        { type: "paragraph", content: [{ type: "text", text: "After block" }] },
      ],
    });

    expect(html).not.toContain("cmsBlock");
    expect(html).not.toContain("mediaBlock");
    expect(html).toContain("After block");
  });

  it("wraps tables in a scroll container", () => {
    const html = renderTiptapContent(table(row("Cell A", "Cell B"), row("Value 1", "Value 2")));
    expect(html).toContain('<div class="tiptap-table-wrap">');
    expect(html).toContain("<table>");
  });

  it("tags comparison tables (EN) and pills the Winner column", () => {
    const html = renderTiptapContent(
      table(
        row("Category", "Winner", "Notes"),
        row("Pricing", "Acme", "Cheaper bundle."),
        row("Dashboards", "Tie", "Even."),
        row("Forms", "Globex", "Faster setup."),
      ),
    );
    expect(html).toContain('<table class="comparison-table">');
    expect(html).toContain('class="winner-cell" data-winner="acme"');
    expect(html).toContain('class="winner-cell" data-winner="globex"');
    expect(html).toContain('class="winner-cell" data-winner="tie"');
  });

  it("tags comparison tables (FR) with Gagnant header and Egalite ties", () => {
    const html = renderTiptapContent(
      table(
        row("Catégorie", "Gagnant", "Notes"),
        row("Tarifs", "Acme", "Moins cher."),
        row("Dashboards", "Égalité", "Pareil."),
      ),
    );
    expect(html).toContain('<table class="comparison-table">');
    expect(html).toContain('data-winner="acme"');
    expect(html).toContain('data-winner="tie"');
  });

  it("names an unknown winner by its first word and files a blank one as other", () => {
    const html = renderTiptapContent(
      table(row("Category", "Winner"), row("Pricing", "Initech wins"), row("Forms", "")),
    );
    expect(html).toContain('data-winner="initech"');
    expect(html).toContain('data-winner="other"');
  });

  it("does not add comparison styling to ordinary tables", () => {
    const html = renderTiptapContent(table(row("Name", "Role"), row("Alice", "Engineer")));
    expect(html).not.toContain("comparison-table");
    expect(html).not.toContain("winner-cell");
  });

  it("ignores the Winner header row itself", () => {
    const html = renderTiptapContent(table(row("Category", "Winner"), row("Pricing", "Acme")));
    expect(html.match(/winner-cell/g)?.length).toBe(1);
  });
});

describe("youtube node", () => {
  function youtubeDoc(attrs: Record<string, unknown>) {
    return { type: "doc", content: [{ type: "youtube", attrs }] };
  }

  it("renders the click-to-load facade for a valid videoId", () => {
    const html = renderTiptapContent(
      youtubeDoc({ videoId: "dQw4w9WgXcQ", title: "How to build a Acme CRM", start: 0 }),
    );
    expect(html).toContain(
      '<div class="tiptap-youtube" data-video-id="dQw4w9WgXcQ" data-start="0">',
    );
    expect(html).toContain('class="tiptap-youtube-trigger"');
    expect(html).toContain('aria-label="Play video: How to build a Acme CRM"');
    expect(html).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(html).toContain('class="tiptap-youtube-play"');
    expect(html).toContain('<span class="tiptap-youtube-title">How to build a Acme CRM</span>');
    expect(html).not.toContain("<iframe");
  });

  it("renders nothing for an invalid videoId", () => {
    const html = renderTiptapContent(
      youtubeDoc({ videoId: "not-11-chars", title: "Bad id", start: 0 }),
    );
    expect(html).toBe("");
  });

  it("renders nothing when videoId is missing", () => {
    const html = renderTiptapContent(youtubeDoc({ title: "No id" }));
    expect(html).toBe("");
  });

  it("carries a non-zero start into data-start", () => {
    const html = renderTiptapContent(youtubeDoc({ videoId: "dQw4w9WgXcQ", title: "T", start: 90 }));
    expect(html).toContain('data-start="90"');
  });

  it("escapes title and videoId in HTML attributes", () => {
    const html = renderTiptapContent(
      youtubeDoc({ videoId: "dQw4w9WgXcQ", title: '"><script>alert(1)</script>', start: 0 }),
    );
    expect(html).not.toContain("<script>");
  });
});
