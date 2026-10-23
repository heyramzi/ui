const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter() : null;

/** The first whole character of a name, uppercased: an emoji or accented letter stays in one piece. */
export function initial(name: string | null | undefined): string {
  const text = (name ?? "").trim();
  if (!text) return "?";
  const first = segmenter
    ? (segmenter.segment(text)[Symbol.iterator]().next().value?.segment ?? "")
    : (Array.from(text)[0] ?? "");
  return first ? first.toLocaleUpperCase() : "?";
}
