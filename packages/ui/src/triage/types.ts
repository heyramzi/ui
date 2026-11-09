import type { Tone } from "#src/lib/tone.js";

/** The words a plan card shows. Pass a partial to translate or reword. */
export type TriagePlanLabels = {
  approve: string;
  pick: string;
  dismiss: string;
  /** The label over the field where the person types the task to use instead. */
  taskLabel: string;
  useTask: string;
  cancel: string;
};

export const DEFAULT_TRIAGE_PLAN_LABELS: TriagePlanLabels = {
  approve: "Approve",
  pick: "Pick another task",
  dismiss: "Dismiss",
  taskLabel: "Task",
  useTask: "Use this task",
  cancel: "Cancel",
};

/** The words a task row shows. */
export type TriageTaskLabels = { undo: string; openTask: string };

export const DEFAULT_TRIAGE_TASK_LABELS: TriageTaskLabels = {
  undo: "Undo",
  openTask: "Open task",
};

/** What happened to a settled email: the chip's words and its tone. */
export type TriageOutcome = { label: string; tone: Tone };

/** The task the email ended up as, when there is one. */
export type TriageTaskLink = { name?: string | null; url: string };
