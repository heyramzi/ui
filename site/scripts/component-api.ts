#!/usr/bin/env node
/* Reads each component's `$props()` typing and writes the API tables the component pages show.
 *
 *   node site/scripts/component-api.ts          write site/src/lib/component-api.json
 *   node site/scripts/component-api.ts --check  exit 1 when the committed JSON is stale
 *
 * Svelte's own parser reads the TypeScript, so nothing is installed for it. A prop's type is
 * the text the file wrote; a type the file pulls from bits-ui or svelte/elements becomes one
 * "...rest" row naming it instead of being expanded. */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { build } from "./component-api/pages.ts";
import { ROOT, SITE } from "./component-api/source.ts";

const OUT = join(SITE, "src/lib/component-api.json");
const CHECK = process.argv.includes("--check");

// ========================= MAIN

/** JSON as `vp fmt` prints it, so the written file passes the format check: a list of plain
 *  values sits on one line when it fits in 100 columns. */
function serialize(value: unknown, indent = "", lead = 0, last = true): string {
  const tail = last ? 0 : 1;
  if (Array.isArray(value) && value.every((v) => typeof v !== "object" || v === null)) {
    const inline = `[${value.map((v) => JSON.stringify(v)).join(", ")}]`;
    if (lead + inline.length + tail <= 100) return inline;
  }
  if (typeof value !== "object" || value === null) return JSON.stringify(value);
  const inner = `${indent}  `;
  const entries: [string | null, unknown][] = Array.isArray(value)
    ? value.map((v) => [null, v])
    : Object.entries(value);
  if (!entries.length) return Array.isArray(value) ? "[]" : "{}";
  const lines = entries.map(([key, v], i) => {
    const head = key === null ? inner : `${inner}${JSON.stringify(key)}: `;
    return head + serialize(v, inner, head.length, i === entries.length - 1);
  });
  const [open, close] = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  return `${open}\n${lines.join(",\n")}\n${indent}${close}`;
}

const data = build();
// The round trip drops the undefined fields, the same as the committed file has them dropped.
const fresh: Record<string, unknown> = JSON.parse(JSON.stringify(data));

if (CHECK) {
  const committed: Record<string, unknown> | null = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, "utf8"))
    : null;
  const stale = Object.keys({ ...fresh, ...committed }).filter(
    (slug) => JSON.stringify(fresh[slug]) !== JSON.stringify(committed?.[slug]),
  );
  if (!committed || stale.length) {
    const which = stale.length ? ` for ${stale.join(", ")}` : "";
    console.error(`component-api.json is stale${which}. Run: node site/scripts/component-api.ts`);
    process.exit(1);
  }
  console.log(`component-api.json is current (${Object.keys(fresh).length} pages)`);
} else {
  writeFileSync(OUT, `${serialize(fresh)}\n`);
  const parts = Object.values(data).flat().length;
  console.log(`wrote ${relative(ROOT, OUT)}: ${Object.keys(data).length} pages, ${parts} parts`);
}
