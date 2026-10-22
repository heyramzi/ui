// The view types of a client or project record. Plain data in, nothing loaded:
// the host maps its own rows onto these and passes them down.
import type { PhosphorIcon } from "#src/lib/icon-types.js";
import type { Tone } from "#src/lib/tone.js";

/** Where a stage sits in the pipeline. Structure, not an agency's own names. */
export type StageCategory = "open" | "proposal" | "ongoing" | "completed" | "lost";

/** One stage an agency declares. The record draws its label and tone. */
export type StageDef = {
  key: string;
  label: string;
  tone: Tone;
  category: StageCategory;
};

/**
 * One thing that happened. Append-only. It belongs to a project, or to a client
 * when no project exists yet. `occurredAt` is an ISO timestamp.
 */
export type RecordEvent = {
  id: string;
  /** A registry key: `call`, `note`, `stage`, or a module's own `slug:name`. */
  kind: string;
  occurredAt: string;
  title: string;
  body?: string | null;
  /** Money, in the currency's major unit. */
  amount?: number | null;
  currency?: string | null;
  /** Who or what wrote it. The host resolves the name. */
  actor?: string | null;
  /** A note that changed after posting. */
  edited?: boolean;
  /** The kind's own declared fields, already formatted by the host for display. */
  details?: { label: string; value: string }[];
  /** The project it belongs to. Set in client mode, so each entry can say which. */
  projectId?: string | null;
  projectName?: string | null;
  projectHref?: string | null;
  /** Where the event's source lives: the call, the invoice, the deck. */
  href?: string | null;
};

/** The numbers and lines one project rolls up to. The host computes them. */
export type RecordSummary = {
  id: string;
  name: string;
  href?: string;
  stageKey: string;
  /** Short qualifier drawn after the stage, such as a loss reason. */
  stageDetail?: string | null;
  /** Money, in the currency's major unit. */
  value?: number | null;
  currency?: string | null;
  /** Money received, from payment events. */
  paid?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  whereWeAre?: {
    text: string;
    /** ISO timestamp of the status event. */
    at?: string | null;
    actor?: string | null;
    health?: { label: string; tone: Tone } | null;
  } | null;
  next?: RecordNext | null;
  lastCallAt?: string | null;
  lastTouchAt?: string | null;
  progress?: { done: number; total: number } | null;
  /** A cancelled or archived project: dropped from "active" and "next". */
  closed?: boolean;
};

/** The next milestone, or the next dated task when there are no milestones. */
export type RecordNext = {
  label: string;
  /** ISO date. */
  date?: string | null;
  /** ISO date, for a range. */
  endDate?: string | null;
  owner?: string | null;
  href?: string | null;
  projectId?: string | null;
  projectName?: string | null;
};

/**
 * Each field type with its config and value; after adding one, fix what `pnpm check` raises in
 * `fieldRow` and `INPUT` (`fields.ts`) and `InfoList`.
 */
export type FieldTypes = {
  text: { config: Record<never, never>; value: string };
  longtext: { config: Record<never, never>; value: string };
  choice: { config: { options: FieldOption[] }; value: string };
  multi: { config: { options: FieldOption[] }; value: string[] };
  money: { config: { currency?: string }; value: number };
  date: { config: Record<never, never>; value: string };
  url: { config: Record<never, never>; value: string };
  email: { config: Record<never, never>; value: string };
  timezone: { config: Record<never, never>; value: string };
  tags: { config: TagsConfig; value: string[] };
};

export type FieldType = keyof FieldTypes;

/** Where a tags field's labels come from, and whether a new one may be made. */
export type TagsConfig = {
  /** `"existing-values"`: every value used on this field before. Or a fixed list. */
  options: "existing-values" | readonly string[];
  /** Whether the "Create" row is offered. A fixed list with `false` is a closed set. */
  allowCreate: boolean;
  max?: number;
};

export type FieldOption = {
  key: string;
  label: string;
  tone?: Tone;
  /** Still reads on old records, cannot be picked. */
  archived?: boolean;
};

/** What a field holds. A choice is its option key, a multi is its keys, tags are the labels. */
export type FieldValue = string | number | string[] | null;

type FieldBase = {
  key: string;
  label: string;
  section?: string;
  required?: boolean;
  /** Shown only while another field has this value. Without `equals`, any value. */
  showWhen?: { key: string; equals?: string | string[] };
  placeholder?: string;
};

/** One attribute a module declares. `type` picks the config, so a field can't hold another type's. */
export type FieldDef = {
  [T in FieldType]: FieldBase & { type: T } & FieldTypes[T]["config"];
}[FieldType];

export type FieldSectionDef = { key: string; label: string };

/** One step of the rail. A step is a milestone task. */
export type StepDef = {
  id: string;
  label: string;
  done: boolean;
  /** Which group header it sits under, such as Sales or Delivery. */
  group?: string;
  /** ISO dates. Both set draws a range, one draws a day. */
  start?: string | null;
  end?: string | null;
  /** Hidden from the rail, still in the edit menu. */
  hidden?: boolean;
  /** The label was renamed: the menu offers a reset. */
  renamed?: boolean;
};

export type StepGroupDef = { key: string; label: string };

export type StepMarker = "complete" | "current" | "late" | "pending";

/** One row of an `InfoList`. The value is already formatted for display. */
export type InfoRow = {
  /** Names the row for a host to find it. Falls back to the label. */
  id?: string;
  label: string;
  icon?: PhosphorIcon;
  value?: string | null;
  /** A coloured chip in place of plain text. */
  tone?: Tone;
  /** Chips for a multi value. Wins over `value`. */
  chips?: { label: string; tone?: Tone }[];
  /** What the editor starts from, when it differs from what is drawn. */
  editValue?: string | string[] | null;
  href?: string;
  muted?: boolean;
  /** `select` becomes a searchable list past seven options. */
  input?: "text" | "longtext" | "select" | "multi" | "date" | "number" | "url" | "email" | "tags";
  options?: { value: string; label: string; tone?: Tone }[];
  /** For `tags`: the labels to pick from, and whether a new one may be made. */
  tags?: { options: readonly string[]; allowCreate: boolean; max?: number };
  placeholder?: string;
  required?: boolean;
  /** Without it the row is read-only. A multi row passes the picked keys. */
  onSave?: (value: string | string[]) => void | Promise<void>;
  divider?: boolean;
};

/** A kind of event: how its filter chip and its default row read. */
export type RecordKindDef = {
  key: string;
  label: string;
  icon?: PhosphorIcon;
  tone?: Tone;
};

/** A filter chip: a label over the kinds it shows. */
export type RecordFilterDef = { key: string; label: string; kinds: string[] };

export type RecordLabels = {
  whereWeAre: string;
  more: string;
  less: string;
  next: string;
  late: string;
  steps: string;
  stepsCount: (done: number, total: number) => string;
  editSteps: string;
  rename: string;
  resetName: string;
  hide: string;
  show: string;
  moveUp: string;
  moveDown: string;
  shownCount: (shown: number, total: number) => string;
  openSteps: string;
  activity: string;
  all: string;
  noEvents: string;
  older: (count: number) => string;
  today: string;
  yesterday: string;
  by: (name: string) => string;
  projects: string;
  projectCount: (count: number) => string;
  noProjects: string;
  details: string;
  edit: (field: string) => string;
  add: (field: string) => string;
  save: string;
  cancel: string;
  search: string;
  noMatch: string;
  pipeline: string;
  won: string;
  paid: string;
  lastCall: string;
  lastTouch: string;
  noCall: string;
  open: string;
  edited: string;
  noSteps: string;
  saveFailed: string;
  required: string;
};

export const DEFAULT_RECORD_LABELS: RecordLabels = {
  whereWeAre: "Where we are",
  more: "More",
  less: "Less",
  next: "Next",
  late: "Late",
  steps: "Steps",
  stepsCount: (done, total) => `${done}/${total}`,
  editSteps: "Choose visible steps",
  rename: "Rename",
  resetName: "Reset name",
  hide: "Hide",
  show: "Show",
  moveUp: "Move up",
  moveDown: "Move down",
  shownCount: (shown, total) => `${shown} of ${total} shown`,
  openSteps: "Open steps",
  activity: "Activity",
  all: "All",
  noEvents: "Nothing logged yet",
  older: (count) => `Show ${count} older`,
  today: "Today",
  yesterday: "Yesterday",
  by: (name) => `by ${name}`,
  projects: "Projects",
  projectCount: (count) => (count === 1 ? "1 project" : `${count} projects`),
  noProjects: "No projects",
  details: "Details",
  edit: (field) => `Edit ${field}`,
  add: (field) => `Add ${field.toLowerCase()}`,
  save: "Save",
  cancel: "Cancel",
  search: "Search",
  noMatch: "No match",
  pipeline: "Pipeline",
  won: "Won",
  paid: "Paid",
  lastCall: "Last call",
  lastTouch: "Last touch",
  noCall: "None yet",
  open: "Open",
  edited: "edited",
  noSteps: "No steps yet",
  saveFailed: "Couldn't save",
  required: "Required",
};

/** Merge a partial label set over the defaults. */
export function resolveLabels(labels?: Partial<RecordLabels>): RecordLabels {
  return labels ? { ...DEFAULT_RECORD_LABELS, ...labels } : DEFAULT_RECORD_LABELS;
}
