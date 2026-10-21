/** A run of text on a board line: plain, or a link the reader can click. */
export type LinkPart = { text: string; href?: string };

const URL_RE = /https?:\/\/[^\s<>"]+/g;
/** Sentence punctuation that follows a link without belonging to it. */
const TRAILING = /[.,;:!?)\]'”]+$/;

/** Splits a line so each http(s) link is its own part, minus the punctuation after it. */
export function linkify(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    const href = match[0].replace(TRAILING, "");
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: href, href });
    last = start + href.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function hasLink(text: string): boolean {
  return /https?:\/\//.test(text);
}
