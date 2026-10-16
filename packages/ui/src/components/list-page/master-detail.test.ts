import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const here = dirname(fileURLToPath(import.meta.url));
const shell = readFileSync(resolve(here, "master-detail.svelte"), "utf8");
const row = readFileSync(resolve(here, "rail-row.svelte"), "utf8");

describe("master detail on a phone", () => {
  it("shows one pane at a time below the stack breakpoint", () => {
    // Two rows put a 34svh rail scroller above a second one. One row, one
    // pane, hidden only while stacked so desktop stays untouched.
    expect(shell).toContain("grid-rows-[minmax(0,1fr)] lg:grid-rows-1");
    expect(shell).toContain("grid-rows-[minmax(0,1fr)] xl:grid-rows-1");
    expect(shell).not.toContain("max-h-[34svh]");
    expect(shell).toContain('stackBelow === "xl" ? "max-xl:hidden" : "max-lg:hidden"');
    expect(shell).toContain('stackBelow && pane === "detail" && hideWhileStacked');
    expect(shell).toContain('stackBelow && pane === "rail" && hideWhileStacked');
  });

  it("draws a way back to the list, and only while stacked", () => {
    expect(shell).toContain('stackBelow === "xl" ? "xl:hidden" : "lg:hidden"');
    expect(shell).toContain('onclick={() => (pane = "rail")}');
    expect(shell).toContain("{backLabel}");
  });

  it("lets a page open on the record its url names", () => {
    expect(shell).toContain('pane = $bindable("rail")');
  });

  it("moves to the record when a rail row is picked", () => {
    expect(shell).toContain("setContext<MasterDetailPane>(MASTER_DETAIL_PANE");
    expect(row).toContain("getContext<MasterDetailPane | undefined>(MASTER_DETAIL_PANE)");
    expect(row).toContain("pane?.open()");
  });
});
