import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import * as record from "#src/record/index.js";
import * as inbox from "#src/inbox/index.js";
import * as thread from "#src/thread/index.js";

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
) as {
  exports: Record<string, string | Record<string, string>>;
};

describe("module split", () => {
  it("holds the record page's names", () => {
    expect(record.RecordShell).toBeDefined();
    expect(record.DEFAULT_RECORD_LABELS).toBeDefined();
  });

  it("names what the new modules export", () => {
    expect(thread.Thread).toBeDefined();
    expect(inbox.ThreadInbox).toBeDefined();
    expect(inbox.InboxCard).toBeDefined();
    expect(inbox.threadsOf).toBeTypeOf("function");
  });

  it("resolves every export path to a file", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const missing: string[] = [];
    for (const [name, target] of Object.entries(pkg.exports)) {
      const path = typeof target === "string" ? target : (target.default ?? target.svelte);
      if (path.includes("*") || path.endsWith(".css")) continue;
      if (!existsSync(join(root, path))) missing.push(`${name} -> ${path}`);
    }
    expect(missing).toEqual([]);
  });

  it("exports each module once, under its own name", () => {
    for (const name of ["./work", "./status", "./panel", "./record", "./thread", "./inbox"]) {
      expect(pkg.exports[name], name).toBeDefined();
    }
    expect(Object.keys(pkg.exports).filter((name) => name.startsWith("./tasks"))).toEqual([]);
  });
});
