import type { Beat, BeatKind, BeatState, Pass, ReviewModel } from "#src/core/types.js";

/** Kinds nobody audits one by one: untouched means kept, and only a Skip or a note changes that. */
export const AUTO_KEEP: readonly string[] = ["layout", "sound"];

/** What a beat stands at. An untouched layout or sound reads as kept, never as work left. */
export const stateOf = (beat: Beat): BeatState =>
  beat.state === "proposed" && AUTO_KEEP.includes(beat.kind) ? "approved" : beat.state;

/** A beat still waiting on a person. A changed pick counts until someone keeps it. */
export const isOpenBeat = (beat: Beat): boolean =>
  !beat.orphaned && (stateOf(beat) === "proposed" || stateOf(beat) === "changed");

export type BeatFilter = "all" | "todo" | "kept" | "skipped";

export const BEAT_FILTERS: { id: BeatFilter; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "all", label: "All" },
  { id: "kept", label: "Kept" },
  { id: "skipped", label: "Skipped" },
];

export function matchesFilter(beat: Beat, filter: BeatFilter): boolean {
  if (filter === "all") return true;
  const state = stateOf(beat);
  if (filter === "todo") return state === "proposed" || state === "changed";
  if (filter === "kept") return state === "approved";
  return state === "skipped";
}

/** The beats a pass owns. A pass with no `kinds` shows every beat. */
export const beatsOf = (
  model: Pick<ReviewModel, "beats">,
  pass: Pick<Pass, "kinds"> | undefined,
): Beat[] =>
  model.beats
    .filter((beat) => !pass?.kinds || pass.kinds.includes(beat.kind))
    .toSorted((a, b) => a.seconds - b.seconds);

/** The pass whose `kinds` include this beat's kind, or undefined. */
export const ownerOf = (model: Pick<ReviewModel, "passes">, kind: string): Pass | undefined =>
  model.passes.find((pass) => pass.kinds?.includes(kind));

export const kindOf = (model: Pick<ReviewModel, "kinds">, id: string): BeatKind | undefined =>
  model.kinds.find((kind) => kind.id === id);

export const pickedOption = (beat: Beat) =>
  beat.options.find((option) => option.id === beat.pick) ?? beat.options[0];

/** The first open beat after `from`, or the first open one before it. */
export function nextOpen(beats: readonly Beat[], from: string | undefined): Beat | undefined {
  const at = beats.findIndex((beat) => beat.id === from);
  return beats.slice(at + 1).find(isOpenBeat) ?? beats.slice(0, Math.max(at, 0)).find(isOpenBeat);
}
