import type { Paragraph, TranscriptLine } from "#src/core/types.js";

/** A line's words, when its word times match its text. Otherwise undefined. */
export function timedWords(line: TranscriptLine): string[] | undefined {
  const words = line.text.split(" ");
  return line.wordSeconds?.length === words.length ? words : undefined;
}

/** Where a click on word `index` of `line` puts the playhead. A line with no word times seeks to its own start. */
export function wordStart(line: TranscriptLine, index: number): number {
  return (timedWords(line) && line.wordSeconds?.[index]) ?? line.seconds;
}

export const wordKey = (pi: number, li: number, wi: number): string => `${pi}:${li}:${wi}`;

/** Every heard word, in playing order, with the output second it starts at. Cut text and untimed lines don't play, so they're left out. */
export function wordClock(paragraphs: Paragraph[]): { key: string; at: number }[] {
  const clock = paragraphs.flatMap((para, pi) =>
    para.lines.flatMap((line, li) =>
      line.marks?.includes("cut") || !timedWords(line)
        ? []
        : (line.wordSeconds ?? []).map((at, wi) => ({ key: wordKey(pi, li, wi), at })),
    ),
  );
  return clock.sort((a, b) => a.at - b.at);
}

// WHY: a seek lands on a frame, so the playhead can read a hair under a word's start, and
// without this slack the word before lights up.
const SLACK = 0.002;

/** The word the playhead is on: the last one that has started. Undefined before the first word. */
export function wordAt(clock: { key: string; at: number }[], time: number): string | undefined {
  let low = 0;
  let high = clock.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if ((clock[mid]?.at ?? Infinity) <= time + SLACK) low = mid + 1;
    else high = mid;
  }
  return clock[low - 1]?.key;
}
