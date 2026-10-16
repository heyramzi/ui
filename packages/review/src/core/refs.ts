import type { Shelf } from "#src/core/types.js";

/** A note's text, cut into plain runs and `[shelf: item]` references. */
export type Segment = { text: string } | { shelf: string; id: string };

const REF = /\[([\w-]+): ([^\]\n]+)\]/g;

export function splitRefs(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(REF)) {
    if (match.index > last) out.push({ text: text.slice(last, match.index) });
    out.push({ shelf: match[1] ?? "", id: match[2] ?? "" });
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** Where the caret sits in an `@` or `/` request, and what it asks for. */
export type Trigger = { from: number; shelves: string[]; query: string };

const flat = (word: string) => word.toLowerCase().replaceAll("-", "");

/**
 * `@` lists every shelf, `@motion pop` filters one, `/mo` opens shelves by prefix. Null otherwise.
 */
export function triggerAt(value: string, caret: number, shelves: readonly Shelf[]): Trigger | null {
  const before = value.slice(0, caret);
  const match = before.match(/(?:^|\s)([@/])([\w-]*)(?: ([^\n[\]@]{0,40}))?$/);
  if (!match || shelves.length === 0) return null;
  const [whole = "", mark, word = "", rest] = match;
  const from = before.length - whole.length + (whole.length - whole.trimStart().length);
  const key = flat(word);
  const all = shelves.map((shelf) => shelf.id);
  const exact = shelves.find((shelf) => flat(shelf.id) === key || flat(shelf.label) === key);
  if (exact && key) return { from, shelves: [exact.id], query: rest ?? "" };
  if (mark === "/") {
    if (rest !== undefined) return null;
    const near = shelves.filter(
      (shelf) => flat(shelf.id).startsWith(key) || flat(shelf.label).startsWith(key),
    );
    return near.length ? { from, shelves: near.map((shelf) => shelf.id), query: "" } : null;
  }
  return { from, shelves: all, query: word + (rest !== undefined ? ` ${rest}` : "") };
}

export type Pick = { shelf: Shelf; item: Shelf["items"][number] };

/** The items a trigger offers: every query word has to appear in the id, name or meta. */
export function itemsFor(shelves: readonly Shelf[], trigger: Trigger): Pick[] {
  const words = trigger.query.toLowerCase().split(/\s+/).filter(Boolean);
  const limit = trigger.shelves.length > 1 ? 12 : 80;
  return trigger.shelves.flatMap((id) => {
    const shelf = shelves.find((entry) => entry.id === id);
    if (!shelf) return [];
    const hits = shelf.items.filter((item) => {
      const hay = `${item.id} ${item.name} ${item.meta ?? ""}`.toLowerCase();
      return words.every((word) => hay.includes(word));
    });
    return hits.slice(0, limit).map((item) => ({ shelf, item }));
  });
}

/** Swap the request for `[shelf: item] `, and say where the caret goes. */
export function insertRef(
  value: string,
  trigger: Trigger,
  caret: number,
  pick: Pick,
): { value: string; caret: number } {
  const tag = `[${pick.shelf.id}: ${pick.item.id}] `;
  return {
    value: value.slice(0, trigger.from) + tag + value.slice(caret),
    caret: trigger.from + tag.length,
  };
}

/** The item a reference points at, when the library has it. */
export function findItem(shelves: readonly Shelf[], shelf: string, id: string): Pick | undefined {
  const owner = shelves.find((entry) => entry.id === shelf);
  const item = owner?.items.find((entry) => entry.id === id);
  return owner && item ? { shelf: owner, item } : undefined;
}
