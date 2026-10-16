import { describe, expect, test } from "vite-plus/test";
import { generateCss, type CssOptions } from "#src/effects/border-beam/css.js";

function options(overrides: Partial<CssOptions> = {}): CssOptions {
  return {
    id: "bb-test",
    borderRadius: 16,
    borderWidth: 1,
    duration: 1.96,
    strokeOpacity: 0.48,
    innerOpacity: 0.7,
    bloomOpacity: 0.8,
    innerShadow: "rgba(255, 255, 255, 0.27)",
    size: "md",
    colorVariant: "colorful",
    staticColors: false,
    brightness: 1.3,
    saturation: 1.2,
    hueRange: 30,
    theme: "dark",
    bloom: true,
    ...overrides,
  };
}

describe("generateCss", () => {
  test("cycles the hue when the colours are the beam's own", () => {
    const css = generateCss(options());

    expect(css).toContain("animation: beam-hue-shift-bb-test");
    expect(css).toContain("hue-rotate(-30deg) brightness(1.30) saturate(1.20)");
  });

  test("keeps brightness and saturation when the colours are fixed", () => {
    const css = generateCss(options({ staticColors: true }));

    expect(css).not.toContain("beam-hue-shift");
    expect(css).toContain("filter: brightness(1.30) saturate(1.20);");
  });

  test("keeps the line bloom's blur when the colours are fixed", () => {
    const css = generateCss(options({ size: "line", staticColors: true }));

    expect(css).toContain("filter: blur(8px) brightness(1.30) saturate(1.20);");
  });
});
