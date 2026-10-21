import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { BRAND_COLOR_VARS, applyBrand, brandCss, brandStyle, brandVars, defineBrand } from "#src/brand/index.js";

const TOKENS = join(import.meta.dirname, "..", "tokens");
const palette = readFileSync(join(TOKENS, "palette.css"), "utf8");

describe("brandVars", () => {
  it("sets only the roles a brand names", () => {
    const brand = defineBrand({ colors: { brand: "oklch(0.5 0.2 272)", signal: "#f0503d" } });
    expect(brandVars(brand)).toEqual({ "--brand": "oklch(0.5 0.2 272)", "--brand-signal": "#f0503d" });
  });

  it("maps fonts and extra properties", () => {
    const brand = defineBrand({
      colors: { brand: "red" },
      fonts: { sans: '"Satoshi", system-ui', mono: "ui-monospace" },
      vars: { "--logo-height": "24px" },
    });
    expect(brandVars(brand)).toEqual({
      "--brand": "red",
      "--font-sans": '"Satoshi", system-ui',
      "--font-mono": "ui-monospace",
      "--logo-height": "24px",
    });
  });

  it("refuses a value that would break out of its declaration", () => {
    expect(() => brandVars({ colors: { brand: "red; } body { display: none" } })).toThrow(/--brand/);
  });
});

describe("the three ways to apply one", () => {
  const brand = defineBrand({ colors: { brand: "blue", ink: "black" } });

  it("writes a style attribute and a rule", () => {
    expect(brandStyle(brand)).toBe("--brand:blue;--brand-ink:black");
    expect(brandCss(brand, ".client")).toBe(".client {\n  --brand: blue;\n  --brand-ink: black;\n}\n");
  });

  it("applies to an element and puts back what it found", () => {
    const root = document.createElement("div");
    root.style.setProperty("--brand", "green");
    const reset = applyBrand(brand, root);
    expect(root.style.getPropertyValue("--brand")).toBe("blue");
    expect(root.style.getPropertyValue("--brand-ink")).toBe("black");
    reset();
    expect(root.style.getPropertyValue("--brand")).toBe("green");
    expect(root.style.getPropertyValue("--brand-ink")).toBe("");
  });
});

describe("the tokens", () => {
  it("define a neutral default for every role a brand can set", () => {
    for (const name of Object.values(BRAND_COLOR_VARS)) {
      expect(palette, name).toMatch(new RegExp(`^\\s+${name}: `, "m"));
    }
  });

  it("carry no client palette", () => {
    for (const file of readdirSync(TOKENS).filter((f) => f.endsWith(".css"))) {
      const css = readFileSync(join(TOKENS, file), "utf8");
      expect(css, file).not.toMatch(/brand-(indigo|sand|terra|night|veil|dusk|cream|linen|mist)|--(indigo|sand|terra)-\d/);
    }
  });
});
