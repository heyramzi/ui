import { describe, it, expect } from "vitest";
import {
  num,
  escapeXml,
  rotationTransform,
  wrapSvg,
  pathEl,
  polylineToPath,
  strokeOutlineToPath,
} from "./svg";
import { make } from "./test-fixtures";
import { rectUtil } from "./rect";

describe("num", () => {
  it("rounds to two decimals and drops the tail", () => {
    expect(num(1.2345)).toBe("1.23");
    expect(num(2)).toBe("2");
    expect(num(-1.236)).toBe("-1.24");
  });

  it("guards against non-finite values", () => {
    expect(num(Infinity)).toBe("0");
    expect(num(NaN)).toBe("0");
  });
});

describe("escapeXml", () => {
  it("escapes the five markup characters", () => {
    expect(escapeXml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&apos;");
  });
});

describe("rotationTransform", () => {
  it("is empty when straight", () => {
    expect(rotationTransform(make(rectUtil))).toBe("");
  });

  it("rotates around the box centre", () => {
    const shape = make(rectUtil, { x: 0, y: 0, w: 100, h: 50, rotation: Math.PI / 2 });
    expect(rotationTransform(shape)).toBe(' transform="rotate(90 50 25)"');
  });
});

describe("wrapSvg", () => {
  it("adds a group only when rotated", () => {
    expect(wrapSvg(make(rectUtil), "<rect/>")).toBe("<rect/>");
    const turned = make(rectUtil, { rotation: 1 });
    expect(wrapSvg(turned, "<rect/>")).toBe(`<g${rotationTransform(turned)}><rect/></g>`);
  });
});

describe("pathEl", () => {
  it("writes d, stroke, fill and width", () => {
    expect(pathEl("M 0 0", "#111", "none", 2)).toContain('d="M 0 0"');
    expect(pathEl("M 0 0", "#111", "none", 2)).toContain('stroke="#111"');
  });
});

describe("polylineToPath", () => {
  it("moves then lines", () => {
    expect(
      polylineToPath([
        { x: 0, y: 0 },
        { x: 5, y: 6 },
      ])
    ).toBe("M 0 0 L 5 6");
  });

  it("is empty for no points", () => {
    expect(polylineToPath([])).toBe("");
  });
});

describe("strokeOutlineToPath", () => {
  it("is empty for a short outline", () => {
    expect(strokeOutlineToPath([[0, 0]])).toBe("");
  });

  it("closes the outline", () => {
    const d = strokeOutlineToPath([
      [0, 0],
      [10, 0],
      [10, 10],
    ]);
    expect(d.startsWith("M 0 0")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });
});
