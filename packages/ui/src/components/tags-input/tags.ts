// The tag list's rules, with no DOM. Options are the values already used, so a spelling gets picked,
// never retyped, and a new tag is a deliberate act.

/** Splits typed or pasted text on commas and newlines, trimmed, empties dropped. */
export function splitTags(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** What two spellings are compared by: no case, no spaces, no marks ("Share Point" is "SharePoint"). */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "");
}

const same = (a: string, b: string) => fold(a) === fold(b);

/** Edits (insert, delete, replace, swap of neighbours) between two strings, stopping past `limit`. */
export function editDistance(a: string, b: string, limit = 2): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
    }
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

/** How close `query` is to `option`: 0 the same, 1 a prefix, 2 contained, 3 a typo away, else null. */
function rank(option: string, query: string): number | null {
  const o = fold(option);
  const q = fold(query);
  if (o === q) return 0;
  if (o.startsWith(q)) return 1;
  if (o.includes(q)) return 2;
  // One edit for a short word, two from 7 letters, and not at all for 3 or fewer.
  const limit = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  return limit > 0 && editDistance(o, q, limit) <= limit ? 3 : null;
}

/**
 * The options to offer for what's typed, closest first, from exact match down to a typo away.
 * Options already on the field are left out.
 */
export function matchOptions(
  options: readonly string[],
  tags: readonly string[],
  query: string,
  limit = 8,
): string[] {
  const open = options.filter((option) => !tags.some((held) => same(held, option)));
  if (!query.trim()) return open.slice(0, limit);
  return open
    .flatMap((option) => {
      const r = rank(option, query);
      return r === null ? [] : [{ option, r }];
    })
    .sort((a, b) => a.r - b.r)
    .map(({ option }) => option)
    .slice(0, limit);
}

/** The existing option that is `input` apart from case, spacing and marks, or undefined. */
export function findOption(options: readonly string[], input: string): string | undefined {
  return options.find((option) => same(option, input));
}

/**
 * Whether typing `query` may offer "Create": never for a word an option or tag already is. A
 * typo's close option shows above it, never instead.
 */
export function canCreate(
  options: readonly string[],
  tags: readonly string[],
  query: string,
  allowCreate = true,
): boolean {
  return (
    allowCreate && query.trim() !== "" && ![...options, ...tags].some((held) => same(held, query))
  );
}

/**
 * The list after adding the option `name`, in the option's spelling. A repeat returns the same
 * array, so a caller can skip the save.
 */
export function addTag(
  tags: readonly string[],
  name: string,
  options: readonly string[] = [],
  max?: number,
): readonly string[] {
  const tag = findOption(options, name) ?? name.trim();
  if (!tag || tags.some((held) => same(held, tag))) return tags;
  if (max !== undefined && tags.length >= max) return tags;
  return [...tags, tag];
}

/** The list without `tag`, whatever its casing. */
export function removeTag(tags: readonly string[], tag: string): string[] {
  return tags.filter((held) => !same(held, tag));
}

/**
 * Collapses spellings of one word to the first, and takes an option's spelling when one matches.
 * For a list that was stored before the options existed.
 */
export function cleanTags(tags: readonly string[], options: readonly string[] = []): string[] {
  return tags.reduce<string[]>((out, tag) => [...addTag(out, tag, options)], []);
}

/**
 * The distinct values across many lists, one spelling each: the most used wins, then the first
 * seen. This is what an "existing values" field offers as its options.
 */
export function collectOptions(lists: Iterable<readonly string[]>): string[] {
  const seen = new Map<string, Map<string, number>>();
  for (const list of lists)
    for (const raw of list) {
      const tag = raw.trim();
      if (!tag) continue;
      const spellings = seen.get(fold(tag)) ?? new Map<string, number>();
      spellings.set(tag, (spellings.get(tag) ?? 0) + 1);
      seen.set(fold(tag), spellings);
    }
  return [...seen.values()]
    .map((spellings) => [...spellings].sort((a, b) => b[1] - a[1])[0][0])
    .sort((a, b) => a.localeCompare(b));
}
