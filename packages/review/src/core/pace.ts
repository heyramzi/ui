import { clockToSeconds } from "#src/core/format.js";
import type { Beat, ReviewModel } from "#src/core/types.js";

/** Beats per minute a finished cut should hold. Layouts and inserts are counted apart. */
export const TARGETS = { layouts: 5, inserts: 4 } as const;

/** Kinds that cover the frame with something else: everything but layouts, zooms and sounds. */
const NOT_INSERTS: readonly string[] = ["layout", "zoom", "sound"];

export type Section = { id: "intro" | "meat" | "outro"; label: string; from: number; to: number };

export type PaceRow = {
  id: Section["id"] | "all";
  label: string;
  minutes: number;
  layouts: number;
  inserts: number;
};

const live = (beat: Beat) => !beat.orphaned && beat.state !== "skipped";

/** The length of the video: the player's, else the last thing said or placed. */
export function lengthOf(model: Pick<ReviewModel, "player" | "paragraphs" | "beats">): number {
  if (model.player?.duration) return model.player.duration;
  const lines = model.paragraphs.flatMap((p) => p.lines.map((l) => l.seconds));
  return Math.max(0, ...lines, ...model.beats.map((b) => b.seconds));
}

/**
 * Intro is the first chapter, outro the last, the meat everything between. With fewer than
 * three chapters there's nothing to split, so the whole video is one section.
 */
export function sectionsOf(
  model: Pick<ReviewModel, "player" | "paragraphs" | "beats">,
): Section[] {
  const end = lengthOf(model);
  const starts = model.paragraphs.filter((p) => p.chapter).map((p) => clockToSeconds(p.at));
  const introEnd = starts[1];
  const outroStart = starts.at(-1);
  if (starts.length < 3 || end <= 0 || introEnd === undefined || outroStart === undefined) return [];
  return [
    { id: "intro", label: "Intro", from: 0, to: introEnd },
    { id: "meat", label: "Meat", from: introEnd, to: outroStart },
    { id: "outro", label: "Outro", from: outroStart, to: end },
  ];
}

export function paceOf(model: Pick<ReviewModel, "player" | "paragraphs" | "beats">): PaceRow[] {
  const beats = model.beats.filter(live);
  const row = (id: PaceRow["id"], label: string, from: number, to: number): PaceRow => {
    const inside = beats.filter((b) => b.seconds >= from && b.seconds < to + (id === "outro" || id === "all" ? 1 : 0));
    return {
      id,
      label,
      minutes: Math.max(0, to - from) / 60,
      layouts: inside.filter((b) => b.kind === "layout").length,
      inserts: inside.filter((b) => !NOT_INSERTS.includes(b.kind)).length,
    };
  };
  const end = lengthOf(model);
  if (end <= 0) return [];
  return [
    row("all", "Whole video", 0, end),
    ...sectionsOf(model).map((s) => row(s.id, s.label, s.from, s.to)),
  ];
}

/** Beats a minute. Under a quarter of a minute there's no rate worth showing. */
export const rate = (count: number, minutes: number): number =>
  minutes < 0.25 ? 0 : count / minutes;

export function toneOf(perMinute: number, target: number): "ok" | "warn" | "bad" {
  if (perMinute >= target) return "ok";
  return perMinute >= target * 0.7 ? "warn" : "bad";
}
