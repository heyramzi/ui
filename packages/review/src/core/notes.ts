import type { IconName, Note, NoteAct, NoteStatus, NoteTarget } from "#src/core/types.js";

/**
 * The note verbs, once. The server applies them, the optimistic reducer applies them, and the
 * feedback panel draws exactly the ones legal for a note's status.
 */
export type Verb = {
  act: NoteAct;
  label: string;
  icon: IconName;
  /** A single-letter shortcut on the active note. */
  key?: string;
  /** The statuses this verb is legal from. */
  from: readonly NoteStatus[];
  /** Where the note lands. `null` removes it. */
  to: NoteStatus | null;
  /** The main button when it is the first legal verb. */
  primary?: boolean;
};

export const NOTE_VERBS: Record<NoteAct, Verb> = {
  accept: {
    act: "accept",
    label: "Accept",
    icon: "check",
    key: "a",
    from: ["proposal"],
    to: "open",
    primary: true,
  },
  dismiss: {
    act: "dismiss",
    label: "Ignore",
    icon: "x",
    key: "x",
    from: ["proposal"],
    to: "dismissed",
  },
  tick: {
    act: "tick",
    label: "Mark done",
    icon: "check",
    key: "t",
    from: ["answered"],
    to: "done",
    primary: true,
  },
  reopen: { act: "reopen", label: "Reopen", icon: "undo", from: ["done", "dismissed"], to: "open" },
  remove: {
    act: "remove",
    label: "Delete",
    icon: "trash",
    from: ["open", "done", "dismissed"],
    to: null,
  },
};

export const verbsFor = (status: NoteStatus): Verb[] =>
  Object.values(NOTE_VERBS).filter((verb) => verb.from.includes(status));

/** The four tabs of the panel, and which statuses each one holds. */
export type Stage = "needs" | "agents" | "done";

export const STAGES: Record<
  Stage,
  { label: string; statuses: readonly NoteStatus[]; empty: string }
> = {
  needs: {
    label: "Needs you",
    statuses: ["proposal", "answered"],
    empty: "Nothing waiting on you.",
  },
  agents: {
    label: "Agents",
    statuses: ["open", "queued", "working"],
    empty: "No note is with an agent.",
  },
  done: { label: "Done", statuses: ["done", "dismissed"], empty: "Nothing done yet." },
};

export const STAGE_ORDER: readonly Stage[] = ["needs", "agents", "done"];

export const stageOf = (note: Pick<Note, "status">): Stage =>
  STAGE_ORDER.find((stage) => STAGES[stage].statuses.includes(note.status)) ?? "agents";

/** Nothing left for anyone to do on it. */
export const isSettled = (note: Pick<Note, "status">): boolean =>
  note.status === "done" || note.status === "dismissed";

/** A note the page made and the server hasn't answered for yet. */
export const isPending = (note: Pick<Note, "id">): boolean => note.id.startsWith("tmp-");

export const sameTarget = (a: NoteTarget, b: NoteTarget): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
