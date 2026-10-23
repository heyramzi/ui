const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter() : null;

/** The first whole character of a string: an emoji or an accented letter stays in one piece. */
function firstGrapheme(text: string): string {
  if (!text) return "";
  if (segmenter) return segmenter.segment(text)[Symbol.iterator]().next().value?.segment ?? "";
  return Array.from(text)[0] ?? "";
}

/** One letter for an avatar fallback. Falls back to `fallback` for an empty or missing name. */
export function initial(name: string | null | undefined, fallback = "?"): string {
  const first = firstGrapheme((name ?? "").trim());
  return first ? first.toLocaleUpperCase() : fallback;
}

/**
 * Two letters for an avatar fallback, first and last word, skipping suffixes: "Christopher
 * Montgomery III" gives "CM". A one-word name gives one letter.
 */
export function initials(name: string | null | undefined, fallback = "?"): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !/^(?:[IVX]{1,4}|jr\.?|sr\.?)$/i.test(word));
  if (words.length === 0) return initial(name, fallback);
  const head = firstGrapheme(words[0]);
  const tail = words.length > 1 ? firstGrapheme(words[words.length - 1]) : "";
  return (head + tail).toLocaleUpperCase();
}
