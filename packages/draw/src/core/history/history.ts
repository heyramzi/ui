// The undo stack. It stores diffs, not document copies, so a step costs only
// what it touched. A mark collapses a multi-push gesture into one step.

import type { Diff } from "../types";
import { invertDiff, isEmptyDiff, mergeDiffs } from "./diff";

export type History = {
  /** Add a step. An empty diff is ignored, so a selection never lands here. */
  push(diff: Diff): void;
  /** The diff to apply to undo, already inverted, or null at the start. */
  undo(): Diff | null;
  /** The diff to apply to redo, or null at the end. */
  redo(): Diff | null;
  /** Note where a gesture begins, so squashToMark can collapse what follows. */
  mark(): void;
  /** Fold every step since the last mark into one, dropping the redo tail. */
  squashToMark(): Diff | null;
  canUndo(): boolean;
  canRedo(): boolean;
};

export function createHistory(): History {
  let entries: Diff[] = [];
  let cursor = 0;
  let markIndex = 0;

  return {
    push(diff) {
      if (isEmptyDiff(diff)) return;
      // A new step after an undo throws the redone future away.
      entries = entries.slice(0, cursor);
      entries.push(diff);
      cursor = entries.length;
    },

    undo() {
      if (cursor === 0) return null;
      cursor -= 1;
      return invertDiff(entries[cursor]);
    },

    redo() {
      if (cursor >= entries.length) return null;
      const diff = entries[cursor];
      cursor += 1;
      return diff;
    },

    mark() {
      markIndex = cursor;
    },

    squashToMark() {
      const from = Math.min(markIndex, cursor);
      const batch = entries.slice(from, cursor);
      if (batch.length === 0) return null;

      let merged = batch[0];
      for (const entry of batch.slice(1)) merged = mergeDiffs(merged, entry);

      // A gesture that nets to nothing leaves no step behind.
      entries = isEmptyDiff(merged) ? entries.slice(0, from) : [...entries.slice(0, from), merged];
      cursor = entries.length;
      markIndex = cursor;
      return isEmptyDiff(merged) ? null : merged;
    },

    canUndo() {
      return cursor > 0;
    },

    canRedo() {
      return cursor < entries.length;
    },
  };
}
