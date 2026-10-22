// Compiles the TS exports to dist/node with relative specifiers: Node can't strip types under node_modules, nor resolve #src there.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist/node");

rmSync(out, { recursive: true, force: true });
execFileSync("tsc", ["-p", "tsconfig.publish.json"], { cwd: root, stdio: "inherit" });

function* emitted(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* emitted(full);
    else if (entry.name.endsWith(".js") || entry.name.endsWith(".d.ts")) yield full;
  }
}

function relativeTo(file, target) {
  const path = relative(dirname(file), target);
  return path.startsWith(".") ? path : `./${path}`;
}

for (const file of emitted(out)) {
  const text = readFileSync(file, "utf8").replace(/(["'])#src\/([^"']+)\1/g, (_, quote, rest) => {
    // A stylesheet only ships in src; every module has its compiled twin beside this one.
    const target = rest.endsWith(".css") ? join(root, "src", rest) : join(out, rest);
    return `${quote}${relativeTo(file, target)}${quote}`;
  });
  writeFileSync(file, text);
}
