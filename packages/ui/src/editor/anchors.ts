/** Heading anchors: one slug per heading, unique within a document. Pure. */

/** Lowercase, words joined by `-`, accents dropped. An empty result is `section`. */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/** One unique anchor per label, in order: a repeat becomes `name-2`, `name-3`. */
export function anchorIds(labels: string[]): string[] {
  const seen = new Map<string, number>();
  const taken = new Set<string>();
  return labels.map((label) => {
    const base = slugify(label);
    let count = (seen.get(base) ?? 0) + 1;
    let id = count === 1 ? base : `${base}-${count}`;
    // A heading literally called "Setup 2" must not steal the second "Setup".
    while (taken.has(id)) id = `${base}-${++count}`;
    seen.set(base, count);
    taken.add(id);
    return id;
  });
}
