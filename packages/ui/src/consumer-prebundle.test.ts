import { svelte } from "@sveltejs/vite-plugin-svelte";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vite-plus/test";
import { writeSvelteModules } from "#scripts/lib/svelte-modules.mjs";

// A consumer's dev server prebundles this package, types still in each `.svelte.ts`. 3.6.0's
// reveal.svelte.ts killed Locameublé's dev server at startup on `import type`.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
  exports: Record<string, string | string[] | Record<string, string | string[]>>;
};

/** The Vite core a consumer gets beside vite-plugin-svelte; this package only depends on vite-plus. */
type Vite = {
  resolveConfig(config: object, command: "serve", mode: string): Promise<unknown>;
  optimizeDeps(
    config: unknown,
    force: boolean,
  ): Promise<{ optimized: Record<string, { file: string }> }>;
};
const plugin = createRequire(import.meta.url).resolve("@sveltejs/vite-plugin-svelte");
const vite: Vite = await import(pathToFileURL(createRequire(plugin).resolve("vite")).href);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** The tarball's shape: `files` as prepack leaves them, under a consumer's node_modules. */
async function consumer(): Promise<{ dir: string; ui: string }> {
  const dir = mkdtempSync(join(tmpdir(), "ui-consumer-"));
  const nm = join(dir, "node_modules");
  const ui = join(nm, "@heyramzi/ui");
  mkdirSync(ui, { recursive: true });
  cpSync(join(root, "src"), join(ui, "src"), { recursive: true });
  cpSync(join(root, "package.json"), join(ui, "package.json"));
  await writeSvelteModules(join(ui, "src"));
  for (const name of readdirSync(join(root, "node_modules"))) {
    const from = join(root, "node_modules", name);
    const scoped = name.startsWith("@") ? readdirSync(from).map((s) => join(name, s)) : [name];
    if (name.startsWith("@")) mkdirSync(join(nm, name));
    for (const dep of scoped)
      symlinkSync(realpathSync(join(root, "node_modules", dep)), join(nm, dep));
  }
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "consumer", type: "module" }));
  return { dir, ui };
}

/** Every subpath a Svelte app can import, wildcards expanded against the tarball's files. */
function browserEntries(ui: string): string[] {
  const out = new Set<string>();
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value !== "object" || Array.isArray(value)) continue;
    const target = value.svelte;
    if (typeof target !== "string") continue;
    if (!key.includes("*")) {
      out.add(`@heyramzi/ui${key.slice(1)}`);
      continue;
    }
    const [head, tail] = target.split("*");
    for (const file of walk(join(ui, head))) {
      const rel = relative(join(ui, head), file);
      if (!rel.endsWith(tail) || /\.(test|spec)\./.test(rel)) continue;
      out.add(`@heyramzi/ui${key.slice(1).replace("*", rel.slice(0, -tail.length))}`);
    }
  }
  return [...out].toSorted();
}

const made: string[] = [];
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

describe("a consumer's dev server", () => {
  it("writes the type-free modules on every pack and removes them after", () => {
    expect(pkg.scripts.prepack).toContain("node scripts/svelte-modules.mjs");
    expect(pkg.scripts.postpack).toContain("node scripts/svelte-modules.mjs --clean");
  });

  it("prebundles every Svelte subpath, chat windows included", async () => {
    const { dir, ui } = await consumer();
    made.push(dir);
    const include = browserEntries(ui);
    expect(include).toContain("@heyramzi/ui/ai/chat-window");
    expect(include).toContain("@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte");
    expect(include).toContain("@heyramzi/ui/canvas/editor/dispatch.svelte.js");

    const config = await vite.resolveConfig(
      {
        root: dir,
        configFile: false,
        logLevel: "error",
        plugins: [svelte({ configFile: false })],
        optimizeDeps: { include, noDiscovery: true },
      },
      "serve",
      "development",
    );
    const { optimized } = await vite.optimizeDeps(config, true);
    const chat = optimized["@heyramzi/ui/ai/chat-window"];
    expect(chat && existsSync(chat.file)).toBe(true);
    expect(readFileSync(chat.file, "utf8")).toContain("REVEAL_BEATS");
  }, 120_000);
});
