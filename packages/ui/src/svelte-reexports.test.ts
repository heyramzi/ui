import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vite-plus/test";

// A plain tsc consumer (upsys app-cli) reads this package's src through a `*.svelte` shim that
// only knows a default export. A .ts file that re-exports a named value from a .svelte module
// fails there, as PILL_TINT did in 2.21.0. Named values live in a .ts module the component imports.
const root = import.meta.dirname;

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsFiles(path);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

const reexport =
  /export\s+(type\s+)?(\*|\{[^}]*\})\s*(?:as\s+\w+\s*)?from\s*["']([^"']+\.svelte)["']/g;

describe("re-exports from .svelte modules", () => {
  it("carry only the default export or types", () => {
    const offenders: string[] = [];
    for (const file of tsFiles(root)) {
      for (const [, typeOnly, list, from] of readFileSync(file, "utf8").matchAll(reexport)) {
        if (typeOnly) continue;
        const names =
          list === "*"
            ? ["*"]
            : list
                .slice(1, -1)
                .split(",")
                .map((n) => n.trim());
        const values = names.filter(
          (n) => n && n !== "default" && !/^(type\s|default\s+as\s)/.test(n),
        );
        if (values.length)
          offenders.push(`${relative(root, file)}: ${values.join(", ")} from ${from}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
