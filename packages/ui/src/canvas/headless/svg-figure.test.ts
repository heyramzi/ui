import { describe, expect, it } from "vite-plus/test";
import { figureBoxHeight, figureRatio, sanitizeFigureSvg } from "#src/canvas/headless/svg-figure.js";

describe("sanitizeFigureSvg", () => {
  it("keeps the shapes, the text and the geometry", () => {
    const svg = sanitizeFigureSvg(
      '<svg viewBox="0 0 100 40"><rect x="0" y="0" width="60" height="40" fill="#e7f5ff" /><text x="4" y="20" font-size="12">Used</text></svg>',
    );
    expect(svg).toContain('<rect x="0" y="0" width="60" height="40" fill="#e7f5ff" />');
    expect(svg).toContain(">Used</text>");
  });

  it("drops a script with everything inside it", () => {
    const svg = sanitizeFigureSvg('<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>');
    expect(svg).toBe('<svg viewBox="0 0 10 10"></svg>');
  });

  it("drops an event handler and keeps the shape it rode in on", () => {
    const svg = sanitizeFigureSvg('<svg><circle cx="5" cy="5" r="4" onclick="steal()" /></svg>');
    expect(svg).not.toContain("onclick");
    expect(svg).toContain('<circle cx="5" cy="5" r="4" />');
  });

  it("drops a link out of the document but keeps a local reference", () => {
    const svg = sanitizeFigureSvg(
      '<svg><a href="https://evil.test"><rect fill="url(#g)" clip-path="url(https://evil.test)" /></a></svg>',
    );
    expect(svg).not.toContain("evil.test");
    expect(svg).toContain('fill="url(#g)"');
  });

  it("refuses markup with no svg in it, and anything oversized", () => {
    expect(sanitizeFigureSvg("<div>hello</div>")).toBeNull();
    expect(sanitizeFigureSvg(`<svg>${"x".repeat(20000)}</svg>`)).toBeNull();
  });
});

describe("figureRatio", () => {
  it("reads the viewBox first and the width/height pair after it", () => {
    expect(figureRatio('<svg viewBox="0 0 200 50">')).toBe(0.25);
    expect(figureRatio('<svg width="100" height="50">')).toBe(0.5);
    expect(figureRatio("<svg>")).toBeNull();
  });

  it("falls back to a banner when the author drew no box", () => {
    expect(figureBoxHeight('<svg viewBox="0 0 400 100" />', 800)).toBe(200);
    expect(figureBoxHeight("<svg />", 800)).toBe(320);
  });
});
