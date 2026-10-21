// The single write path for diagram mutations. Every edit, from any source, is
// one transaction: a before/after history entry, then dirty and autosave.

// Undo and redo replay those entries.

import type { Node, Edge } from "@xyflow/svelte";
import { applyOps, type CanvasOp } from "#src/canvas/ops/ops.js";
import type { OpDefinition, OpLike } from "#src/canvas/plugin.js";
import { tryCatch } from "#src/lib/result.js";
import {
  applyHistoryEntry,
  diffFlowState,
  mergeHistoryEntries,
  type FlowState,
  type HistoryEntry,
} from "#src/canvas/editor/history-core.js";

const MAX_ENTRIES = 200;

/** Keystrokes under this far apart share one undo step. */
const COALESCE_WINDOW_MS = 1000;

// A drag whose stop never fires (pointer lost, node unmounted) leaves its transaction open,
// and drag frames never reach the dispatcher, so this counts from the last begin or commit.
const STUCK_TRANSACTION_MS = 10_000;

export type CanvasDispatcher<Op extends OpLike = CanvasOp> = ReturnType<
  typeof createCanvasDispatcher<Op>
>;

/** `Op` is the union of op shapes the caller dispatches: the canvas's own plus its plugins'. */
export function createCanvasDispatcher<Op extends OpLike = CanvasOp>(io: {
  getState: () => FlowState;
  setState: (state: FlowState) => void;
  /** Called after every state-changing commit, undo and redo. */
  onMutated: () => void;
  /** The op kinds beyond the canvas's own, from the app's plugins. */
  opDefinitions?: readonly OpDefinition[];
  /** Drops the ops a board refuses before they apply, such as an edit to a locked card. */
  guard?: (nodes: readonly Node[], ops: Op[]) => Op[];
  /** The clock for the coalescing window and the stuck-transaction guard. A test injects its own. */
  now?: () => number;
}) {
  const now = io.now ?? Date.now;
  let undoStack = $state.raw<HistoryEntry[]>([]);
  let redoStack = $state.raw<HistoryEntry[]>([]);
  let depth = 0;
  let baseline: FlowState | null = null;
  let lastActivityAt = 0;
  // The text session the top undo entry belongs to, while keystrokes keep merging into it.
  let session: { key: string; at: number } | null = null;

  // Cards are replaced, never edited in place, so holding the objects equals a deep copy for a pointer each.
  function snapshot(): FlowState {
    const state = io.getState();
    return { nodes: [...state.nodes], edges: [...state.edges] };
  }

  function isStale(): boolean {
    return depth > 0 && now() - lastActivityAt > STUCK_TRANSACTION_MS;
  }

  /** Record the open transaction's diff as one history entry, merged into the text session it continues. */
  function finish(coalesceKey?: string) {
    depth = 0;
    const before = baseline;
    baseline = null;
    const entry = before && diffFlowState(before, io.getState());
    if (!entry) return;
    const at = now();
    const top = undoStack.at(-1);
    if (
      coalesceKey &&
      top &&
      session?.key === coalesceKey &&
      at - session.at < COALESCE_WINDOW_MS
    ) {
      undoStack = [...undoStack.slice(0, -1), mergeHistoryEntries(top, entry)];
      session = { key: coalesceKey, at };
    } else {
      undoStack = [...undoStack.slice(-(MAX_ENTRIES - 1)), entry];
      session = coalesceKey ? { key: coalesceKey, at } : null;
    }
    redoStack = [];
    io.onMutated();
  }

  /** Force-close a transaction nobody closed, so undo and the next gesture work again. */
  function recoverStuck() {
    if (isStale()) finish();
  }

  /** Open a transaction. Nested calls join the outermost one. */
  function begin() {
    recoverStuck();
    lastActivityAt = now();
    if (depth === 0) baseline = snapshot();
    depth += 1;
  }

  /** Close a transaction. The outermost close diffs and records the entry. */
  function commit(coalesceKey?: string) {
    lastActivityAt = now();
    if (depth > 1) {
      depth -= 1;
      return;
    }
    // A commit with no begin has nothing to record.
    if (depth === 1) finish(coalesceKey);
  }

  function run<T>(fn: () => T, coalesceKey?: string): T {
    begin();
    const res = tryCatch(fn);
    commit(coalesceKey);
    if (!res.ok) throw res.error;
    return res.value;
  }

  /**
   * Apply granular ops to the flow state inside a transaction. A `coalesceKey` folds the
   * step into the top undo entry while that key keeps committing under a second apart.
   */
  function dispatch(ops: Op | Op[], options?: { coalesceKey?: string }): boolean {
    const asked = Array.isArray(ops) ? ops : [ops];
    const list = io.guard ? io.guard(io.getState().nodes, asked) : asked;
    if (list.length === 0) return true;
    return run(() => {
      const state = io.getState();
      const res = tryCatch(() =>
        applyOps(
          {
            // `applyOps` patches plain records so one op log replays over xyflow
            // and persisted shapes. Widening in and narrowing out is that seam.
            nodes: state.nodes as Record<string, unknown>[],
            edges: state.edges as Record<string, unknown>[],
          },
          list,
          io.opDefinitions,
        ),
      );
      if (!res.ok) return false;
      io.setState({
        nodes: res.value.nodes as unknown as Node[],
        edges: res.value.edges as unknown as Edge[],
      });
      return true;
    }, options?.coalesceKey);
  }

  // An open gesture owns the baseline, so a replay under it would fold into its entry.
  function undo() {
    recoverStuck();
    session = null;
    const entry = undoStack.at(-1);
    if (!entry || depth > 0) return;
    undoStack = undoStack.slice(0, -1);
    redoStack = [...redoStack, entry];
    io.setState(applyHistoryEntry(io.getState(), entry, "undo"));
    io.onMutated();
  }

  function redo() {
    recoverStuck();
    session = null;
    const entry = redoStack.at(-1);
    if (!entry || depth > 0) return;
    redoStack = redoStack.slice(0, -1);
    undoStack = [...undoStack, entry];
    io.setState(applyHistoryEntry(io.getState(), entry, "redo"));
    io.onMutated();
  }

  return {
    get canUndo() {
      return undoStack.length > 0;
    },
    get canRedo() {
      return redoStack.length > 0;
    },
    /** True while a gesture holds a transaction open. A stuck one reads false. */
    get isOpen() {
      return depth > 0 && !isStale();
    },
    begin,
    /** A long gesture calls this on every frame, so a slow drag isn't mistaken for a stuck one. */
    touch() {
      if (depth > 0) lastActivityAt = now();
    },
    commit: () => commit(),
    run: <T>(fn: () => T) => run(fn),
    dispatch,
    /** End the text session, so the next keystroke starts a new undo step. Call it on blur. */
    endCoalesce() {
      session = null;
    },
    undo,
    redo,
    clear() {
      undoStack = [];
      redoStack = [];
      session = null;
    },
  };
}
