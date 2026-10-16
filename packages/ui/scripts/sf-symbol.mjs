#!/usr/bin/env node
// Print the `sf-symbols.ts` entry for an SF Symbol, read off this Mac. node packages/ui/scripts/sf-symbol.mjs macwindow

// The SF Symbols app is the better source when somebody has it open, because its export is the artwork Apple ships for that symbol at that weight.

// This is for the rest of the time: it asks macOS for the symbol it would draw, takes the outline, and writes it in the same unit space the app's

// exports use. How it gets a vector out of an image: `NSImage(systemSymbolName:)` hands back an `NSSymbolImageRep`, which answers `outlinePath` with the CGPath it fills.

// Drawing that image into a PDF context does not work, because AppKit rasterises it into an image mask.

// `outlinePath` is not API, which is why this is a script somebody runs on their own machine rather than anything the package ships.

// The space: at 512pt Regular Medium the outline measures exactly twice the app's export on both axes, checked against folder, doc.on.doc and magnifyingglass,

// so SCALE is 0.5 and the result drops straight into the shared 768 canvas. trash is the one symbol where the two disagree beyond that,

// macOS 26 having redrawn its lid a little taller, which is a reason to prefer a fresh export when there is one.

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCALE = 0.5;

const SWIFT = `
import AppKit
let cfg = NSImage.SymbolConfiguration(pointSize: 512, weight: .regular, scale: .medium)
guard let rep = NSImage(systemSymbolName: CommandLine.arguments[1], accessibilityDescription: nil)?
        .withSymbolConfiguration(cfg)?.representations.first,
      let raw = rep.value(forKey: "outlinePath") else {
    FileHandle.standardError.write("no such symbol\\n".data(using: .utf8)!)
    exit(2)
}
print(CFCopyDescription(raw as CFTypeRef)! as String)
`;

const name = process.argv[2];
if (!name) {
  console.error("usage: sf-symbol.mjs <symbol-name>");
  process.exit(1);
}

const swiftFile = join(mkdtempSync(join(tmpdir(), "sf-symbol-")), "outline.swift");
writeFileSync(swiftFile, SWIFT);
const dump = execFileSync("swift", [swiftFile, name], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

/** CGPath's own description, which lists one segment per line in PostScript order. */
const commands = [];
for (const line of dump.split("\n")) {
  const parts = line.trim().split(/\s+/);
  const numbers = parts.slice(0, -1).map(Number);
  if (numbers.some(Number.isNaN)) continue;
  const letter = { moveto: "M", lineto: "L", curveto: "C", closepath: "Z" }[parts.at(-1)];
  if (letter) commands.push([letter, letter === "Z" ? [] : numbers]);
}

if (!commands.length) {
  console.error(`no outline for ${name}`);
  process.exit(2);
}

const xs = [];
const ys = [];
for (const [, numbers] of commands) {
  for (const [i, value] of numbers.entries()) (i % 2 ? ys : xs).push(value);
}
const minX = Math.min(...xs);
const minY = Math.min(...ys);

/** Three decimals, which is what the app's own exports carry. */
const round = (value) => Math.round(value * SCALE * 1000) / 1000;

const d = commands
  .map(([letter, numbers]) =>
    letter === "Z"
      ? "Z"
      : letter + numbers.map((v, i) => round(v - (i % 2 ? minY : minX))).join(" "),
  )
  .join("");

const key = /^[a-z][\w]*$/i.test(name) ? name : `"${name}"`;
console.log(`  ${key}: {
    w: ${round(Math.max(...xs) - minX)},
    h: ${round(Math.max(...ys) - minY)},
    paths: [
      "${d}",
    ],
  },`);
