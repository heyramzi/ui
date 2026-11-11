import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { FLAG_CODES, flagCode } from "#src/components/flag/codes.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "flags");

describe("flag codes", () => {
  it("lists exactly the SVG files shipped", () => {
    const files = readdirSync(dir)
      .filter((name) => name.endsWith(".svg"))
      .map((name) => name.slice(0, -4));
    expect(FLAG_CODES.toSorted()).toEqual(files.toSorted());
    expect(FLAG_CODES).toHaveLength(250);
  });

  it("knows Kosovo, which ISO 3166-1 leaves user-assigned", () => {
    expect(flagCode("xk")).toBe("XK");
  });

  it("takes any case and refuses what it has no file for", () => {
    expect(flagCode("jp")).toBe("JP");
    expect(flagCode(" Pl ")).toBe("PL");
    expect(flagCode("")).toBeNull();
    expect(flagCode(undefined)).toBeNull();
    expect(flagCode("ZZ")).toBeNull();
    expect(flagCode("../FR")).toBeNull();
  });
});
