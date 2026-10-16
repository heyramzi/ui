import type { Component } from "svelte";

/** Second argument handed to the list row snippet. */
export type TaskListRowContext = {
  groupId: string;
  index: number;
};

/** Second argument handed to the list group header snippet. */
export type TaskListGroupContext = {
  count: number;
  active: boolean;
  open: boolean;
};

/** What the gantt asks the caller to persist after a bar is moved or resized. */
export type GanttChange = {
  /** ISO date, inclusive. */
  start: string;
  /** ISO date, inclusive. A one-day task has `end === start`. */
  end: string;
};

/** One option in the view switch. */
export type TaskView = {
  id: string;
  label: string;
  /** Any Svelte component that takes `size` and `class`, e.g. `BoardIcon`. */
  icon?: Component<{ size?: number; class?: string }>;
};
