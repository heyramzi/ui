import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { findProblems } from "#scripts/check-tokens.mjs";

const sample = (body: string): string[] => {
  const file = join(mkdtempSync(join(tmpdir(), "tokens-")), "X.svelte");
  writeFileSync(file, `<div></div>\n<style>\n${body}\n</style>\n`);
  return findProblems([file]);
};

describe("check:tokens", () => {
  it("passes on the real source", () => {
    expect(findProblems()).toEqual([]);
  });
  it.each([
    ["hex", "a { color: #fff; }"],
    ["rgb", "a { color: rgb(0 0 0); }"],
    ["oklch", "a { color: oklch(0.5 0.1 20); }"],
    ["hsl", "a { color: hsl(10 10% 10%); }"],
    ["px radius", "a { border-radius: 8px; }"],
    ["corner radius", "a { border-top-left-radius: 4px; }"],
    ["ms", "a { transition: opacity 150ms; }"],
    ["seconds", "a { animation: x 1.5s; }"],
    ["bezier", "a { transition-timing-function: cubic-bezier(0, 0, 1, 1); }"],
  ])("flags %s", (_name, css) => {
    expect(sample(css).length).toBeGreaterThan(0);
  });
  it("lets token references through", () => {
    expect(
      sample(
        "a { color: color-mix(in oklab, var(--accent) 10%, transparent); border-radius: var(--radius-sm); border-radius: 50%; transition: opacity var(--duration-fast) var(--ease-out); }",
      ),
    ).toEqual([]);
  });
});
