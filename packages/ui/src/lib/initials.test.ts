import { describe, expect, it } from "vite-plus/test";
import { initial, initials } from "#src/lib/initials.js";

describe("initial", () => {
  it("keeps an emoji whole and uppercases a lowercase name", () => {
    expect(initial("🦊 Fox")).toBe("🦊");
    expect(initial("dana")).toBe("D");
    expect(initial("Ólafur Darri")).toBe("Ó");
  });
  it("falls back for a missing or blank name", () => {
    expect(initial(undefined)).toBe("?");
    expect(initial("   ")).toBe("?");
  });
});

describe("initials", () => {
  it("takes the first and last word and skips a suffix", () => {
    expect(initials("Christopher Alexander Montgomery III")).toBe("CM");
    expect(initials("  Sam   Lee ")).toBe("SL");
  });
  it("gives one letter for one word and one script without spaces", () => {
    expect(initials("Jo")).toBe("J");
    expect(initials("王秀英")).toBe("王");
  });
});
