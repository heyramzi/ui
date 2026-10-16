// Fails on any colour literal, px radius, raw duration or cubic-bezier outside src/theme/tokens.css.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const ALLOWED = join(SRC, "theme", "tokens.css");

const RULES = [
  {
    name: "colour literal",
    re: /#[0-9a-fA-F]{3,8}\b(?![-\w])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g,
  },
  { name: "px radius", re: /(?:border(?:-[a-z]+)*-radius|--radius[\w-]*)\s*:[^;{}]*\d\s*px/g },
  { name: "raw duration", re: /(?<![\w-])\d*\.?\d+m?s\b(?![-\w(])/g, inStyleOnly: true },
  { name: "cubic-bezier", re: /cubic-bezier\(/g },
];

/** The text of every <style> block in a .svelte file, or the whole file for .css. */
function styleText(file, text) {
  if (file.endsWith(".css")) return text;
  return [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(svelte|css)$/.test(entry.name)) yield path;
  }
}

/** Returns one line per problem: file:line rule match. */
export function findProblems(files = [...walk(SRC)]) {
  const problems = [];
  for (const file of files) {
    if (file === ALLOWED) continue;
    const text = readFileSync(file, "utf8");
    const styles = styleText(file, text);
    for (const rule of RULES) {
      const haystacks = rule.inStyleOnly ? [styles] : [text];
      for (const hay of haystacks) {
        for (const match of hay.matchAll(rule.re)) {
          if (rule.name === "raw duration" && /^0m?s$/.test(match[0])) continue;
          const line = text.slice(0, Math.max(text.indexOf(match[0]), 0)).split("\n").length;
          problems.push(`${relative(ROOT, file)}:${line} ${rule.name}: ${match[0]}`);
        }
      }
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = findProblems();
  if (problems.length) {
    console.error(`${problems.length} token problem(s):\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log("check:tokens ok");
}
