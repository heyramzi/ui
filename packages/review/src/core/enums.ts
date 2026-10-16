import type { BeatState, LineMark, NoteAct, NoteStatus, Tone } from "#src/core/types.js";

/** Each list is checked against its union at compile time, so a new member can't be forgotten. */
type Covers<Union, List extends readonly Union[]> =
  Exclude<Union, List[number]> extends never ? List : never;

export const BEAT_STATES = [
  "proposed",
  "changed",
  "approved",
  "skipped",
] as const satisfies readonly BeatState[];
export const NOTE_ACTS = [
  "tick",
  "reopen",
  "accept",
  "dismiss",
  "remove",
] as const satisfies readonly NoteAct[];
export const NOTE_STATUSES = [
  "open",
  "queued",
  "working",
  "answered",
  "done",
  "proposal",
  "dismissed",
] as const satisfies readonly NoteStatus[];
export const TONES = ["neutral", "accent", "ok", "warn", "bad"] as const satisfies readonly Tone[];
export const LINE_MARKS = ["cut", "moved", "pause"] as const satisfies readonly LineMark[];

export const checkedBeatStates: Covers<BeatState, typeof BEAT_STATES> = BEAT_STATES;
export const checkedNoteActs: Covers<NoteAct, typeof NOTE_ACTS> = NOTE_ACTS;
export const checkedNoteStatuses: Covers<NoteStatus, typeof NOTE_STATUSES> = NOTE_STATUSES;

export const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);
