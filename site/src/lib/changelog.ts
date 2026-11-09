import raw from "../../../packages/ui/CHANGELOG.md?raw";

/** One `## ` section of the library's changelog. */
export type Release = {
  /** `Unreleased`, or the version number without its compare link. */
  version: string;
  /** ISO day from the heading, when it carries one. */
  date?: string;
  /** Anchor id, such as `v2-22-1`. */
  id: string;
  /** The section's Markdown under its heading. */
  body: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-11-09` as `9 Nov 2026`, by hand so the server and the browser print the same text. */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// `[2.22.1](https://...) (2026-11-09)` and `1.21.0 (2026-06-14)` are both in the file.
const VERSION_HEADING =
  /^\[?(\d+)\.(\d+)\.(\d+)[^\]\s]*\]?(?:\([^)]*\))?\s*(?:\((\d{4}-\d{2}-\d{2})\))?/;

type Parsed = Release & { rank: number[] };

function parse(markdown: string): Parsed[] {
  const chunks = markdown.split(/^## /m).slice(1);
  return chunks.map((chunk) => {
    const newline = chunk.indexOf("\n");
    const heading = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const body = newline === -1 ? "" : chunk.slice(newline + 1).trim();
    const match = heading.match(VERSION_HEADING);
    if (!match) {
      // Unreleased sorts above every number, and any other heading below them all.
      const rank = heading.toLowerCase() === "unreleased" ? [Infinity] : [-Infinity];
      return { version: heading, id: slugify(heading), body, rank };
    }
    const [, major, minor, patch, date] = match;
    const version = `${major}.${minor}.${patch}`;
    return {
      version,
      date,
      id: `v${version.replaceAll(".", "-")}`,
      body,
      rank: [+major, +minor, +patch],
    };
  });
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function newestFirst(a: Parsed, b: Parsed): number {
  for (let i = 0; i < Math.max(a.rank.length, b.rank.length); i++) {
    const diff = (b.rank[i] ?? 0) - (a.rank[i] ?? 0);
    if (diff && !Number.isNaN(diff)) return diff;
  }
  return (b.date ?? "").localeCompare(a.date ?? "");
}

/**
 * Every release, newest first, sorted here rather than trusted to the file's order, with a
 * repeated heading's anchor numbered so each section keeps a unique id.
 */
export function releasesOf(markdown: string): Release[] {
  const seen = new Map<string, number>();
  return parse(markdown)
    .toSorted(newestFirst)
    .map(({ rank: _rank, ...release }) => {
      const count = seen.get(release.id) ?? 0;
      seen.set(release.id, count + 1);
      return count ? { ...release, id: `${release.id}-${count + 1}` } : release;
    });
}

export const releases = releasesOf(raw);
