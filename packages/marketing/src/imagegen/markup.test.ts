import { describe, expect, it } from "vite-plus/test";
import { html, raw } from "#src/imagegen/markup.js";

function serialize(node: ReturnType<typeof html>): string {
  return JSON.stringify(node);
}

describe("markup", () => {
  it("interpolates text expressions as escaped text", () => {
    const unsafe = "<script>alert(1)</script>";
    const node = html`<div>${unsafe}</div>`;
    expect(serialize(node)).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(serialize(node)).not.toContain("<script>");
  });

  it("inserts raw() fragments as markup", () => {
    const rects = raw(`<rect width="10" height="10"/><rect width="20" height="20"/>`);
    const node = html`<svg>${rects}</svg>`;
    const out = serialize(node);
    expect(out).toContain('"rect"');
    expect(out).not.toContain("&lt;rect");
  });

  it("inserts raw() fragments with dynamic nested SVG defs", () => {
    const stops = raw(
      [1, 2, 3]
        .map(
          (i) =>
            `<radialGradient id="g-${i}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#000"/></radialGradient>`,
        )
        .join(""),
    );
    const node = html`<svg><defs>${stops}</defs></svg>`;
    const out = serialize(node);
    expect(out).toContain('"radialGradient"');
    expect(out).toContain("g-1");
    expect(out).toContain("g-3");
    expect(out).not.toContain("&lt;radialGradient");
  });

  it("skips null / undefined / false expressions", () => {
    const node = html`<div>${null}${undefined}${false}x</div>`;
    expect(serialize(node)).toContain("x");
    expect(serialize(node)).not.toContain("null");
    expect(serialize(node)).not.toContain("undefined");
    expect(serialize(node)).not.toContain("false");
  });

  it("interpolates arrays: escapes strings, inlines RawMarkup", () => {
    const children = ["<b>escaped</b>", raw("<span>raw</span>"), 42, null];
    const node = html`<div>${children}</div>`;
    const out = serialize(node);
    expect(out).toContain("&lt;b&gt;escaped&lt;/b&gt;");
    expect(out).toContain('"span"');
    expect(out).toContain("42");
  });

  it("preserves attribute-value interpolation as text", () => {
    const color = "#abc123";
    const node = html`<div style="color:${color};"></div>`;
    expect(serialize(node)).toContain('"color":"#abc123"');
  });

  // Type-level regression: passing the return value of html() into another
  // html() call used to stringify to "[object Object]". The typed signature
  // now rejects it at compile time. Enforce with @ts-expect-error.
  it("type-rejects nested html()", () => {
    const inner = html`<span>hi</span>`;
    // @ts-expect-error -- nested SatoriNode is not a valid HtmlExpression
    const _node = html`<div>${inner}</div>`;
    void _node;
  });
});
