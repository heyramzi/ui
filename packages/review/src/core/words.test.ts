import { describe, expect, it } from "vitest";
import type { Paragraph, TranscriptLine } from "#src/core/types.js";
import { timedWords, wordAt, wordClock, wordKey, wordStart } from "#src/core/words.js";

const line = (text: string, seconds: number, wordSeconds?: number[], cut = false): TranscriptLine => ({
  at: "0:00",
  seconds,
  text,
  ...(wordSeconds ? { wordSeconds } : {}),
  ...(cut ? { marks: ["cut" as const] } : {}),
});

const paragraphs: Paragraph[] = [
  {
    at: "0:00",
    lines: [
      line("one two three", 0.5, [0.5, 0.9, 1.4]),
      // a cut take: its words share the spot where it used to sit, the next kept word's start
      line("um well", 3, [3, 3], true),
      line("four five", 3, [3, 3.6]),
    ],
  },
  { at: "0:05", lines: [line("six seven", 5, [5.25, 5.75]), line("eight nine", 7)] },
];

describe("wordStart", () => {
  it("gives each word its own time", () => {
    const l = paragraphs[0]!.lines[0]!;
    expect([0, 1, 2].map((i) => wordStart(l, i))).toEqual([0.5, 0.9, 1.4]);
  });

  it("falls back to the line's start when the word times don't match the text", () => {
    const l = line("one two three", 2, [2, 2.5]);
    expect(timedWords(l)).toBeUndefined();
    expect([0, 1, 2].map((i) => wordStart(l, i))).toEqual([2, 2, 2]);
  });

  it("falls back to the line's start when there are no word times", () => {
    expect(wordStart(line("eight nine", 7), 1)).toBe(7);
  });

  it("keeps a word that starts at zero", () => {
    expect(wordStart(line("hi there", 0, [0, 0.4]), 0)).toBe(0);
  });
});

describe("wordClock", () => {
  it("lists heard words in playing order and skips cut and untimed lines", () => {
    expect(wordClock(paragraphs).map((w) => w.key)).toEqual([
      wordKey(0, 0, 0),
      wordKey(0, 0, 1),
      wordKey(0, 0, 2),
      wordKey(0, 2, 0),
      wordKey(0, 2, 1),
      wordKey(1, 0, 0),
      wordKey(1, 0, 1),
    ]);
  });
});

describe("wordAt", () => {
  const clock = wordClock(paragraphs);

  it("is nothing before the first word", () => {
    expect(wordAt(clock, 0.2)).toBeUndefined();
    expect(wordAt([], 4)).toBeUndefined();
  });

  it("is the last word that has started", () => {
    expect(wordAt(clock, 0.5)).toBe(wordKey(0, 0, 0));
    expect(wordAt(clock, 1.0)).toBe(wordKey(0, 0, 1));
    expect(wordAt(clock, 4.9)).toBe(wordKey(0, 2, 1));
    expect(wordAt(clock, 99)).toBe(wordKey(1, 0, 1));
  });

  it("lands on the word after a cut, not on the cut text", () => {
    expect(wordAt(clock, 3)).toBe(wordKey(0, 2, 0));
  });

  it("holds the word through a seek that lands a hair early", () => {
    expect(wordAt(clock, 5.25 - 0.001)).toBe(wordKey(1, 0, 0));
  });

  it("round-trips: seeking to any word's start highlights that word", () => {
    for (const [pi, para] of paragraphs.entries())
      for (const [li, l] of para.lines.entries()) {
        if (l.marks?.includes("cut") || !timedWords(l)) continue;
        for (const wi of l.text.split(" ").keys())
          expect(wordAt(clock, wordStart(l, wi))).toBe(wordKey(pi, li, wi));
      }
  });
});
