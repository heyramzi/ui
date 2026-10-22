// Emits dist/types for the root export, with each #src specifier made relative: consumers resolve #src to unshipped src.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist/types");

rmSync(out, { recursive: true, force: true });
execFileSync("tsc", ["-p", "tsconfig.types.json"], { cwd: root, stdio: "inherit" });

function* declarations(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* declarations(full);
    else if (entry.name.endsWith(".d.ts")) yield full;
  }
}

function relativeTo(file, target) {
  const path = relative(dirname(file), target);
  return path.startsWith(".") ? path : `./${path}`;
}

for (const file of declarations(out)) {
  const text = readFileSync(file, "utf8").replace(/(["'])#src\/([^"']+)\1/g, (_, quote, rest) => {
    // A stylesheet only ships in src; everything else has a declaration beside this one.
    const target = rest.endsWith(".css") ? join(root, "src", rest) : join(out, rest);
    return `${quote}${relativeTo(file, target)}${quote}`;
  });
  writeFileSync(file, text);
}
