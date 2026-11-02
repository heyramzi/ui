import { SvelteSet } from "svelte/reactivity";

export type KanbanRailConfig = {
  /** The board's controlled `hidden`, or undefined to let the rail remember. */
  hidden: () => string[] | undefined;
  onHiddenChange: () => ((ids: string[]) => void) | undefined;
  canDrop: (columnId: string) => boolean;
  dnd: { clearDragOver: () => void; onDrop: (e: DragEvent, columnId: string) => void };
};

/** The rail of hidden columns: which are folded, the fold and unfold timing, and drops onto it. */
export function createKanbanRailState(config: KanbanRailConfig) {
  const { canDrop, dnd } = config;
  let internalHidden = $state<string[]>([]);
  let hiddenIds = $derived(config.hidden() ?? internalHidden);
  let hiddenSet = $derived(new Set(hiddenIds));

  let railOpen = $state(true);
  let dragOverHidden = $state<string | null>(null);
  const collapsing = new SvelteSet<string>();
  const expanding = new SvelteSet<string>();
  const leaving = new SvelteSet<string>();

  function setHidden(next: string[]): void {
    internalHidden = next;
    config.onHiddenChange()?.(next);
  }

  // Fold: the column fades out first, then leaves the row and joins the rail.
  function hide(columnId: string): void {
    if (hiddenSet.has(columnId) || collapsing.has(columnId)) return;
    collapsing.add(columnId);
    setTimeout(() => {
      setHidden([...hiddenIds, columnId]);
      collapsing.delete(columnId);
    }, 300);
  }

  // Unfold: the rail entry leaves, then the column grows back in.
  function show(columnId: string): void {
    leaving.add(columnId);
    setTimeout(() => {
      leaving.delete(columnId);
      expanding.add(columnId);
      setHidden(hiddenIds.filter((id) => id !== columnId));
      setTimeout(() => expanding.delete(columnId), 350);
    }, 200);
  }

  function showAll(): void {
    for (const id of hiddenIds) leaving.add(id);
    setTimeout(() => {
      leaving.clear();
      setHidden([]);
    }, 200);
  }

  function onHiddenDragOver(e: DragEvent, columnId: string): void {
    if (!canDrop(columnId)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (dragOverHidden !== columnId) dragOverHidden = columnId;
    dnd.clearDragOver();
  }

  function onHiddenDragLeave(e: DragEvent): void {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) dragOverHidden = null;
  }

  // A card dropped on a folded column brings the column back and lands in it.
  function onHiddenDrop(e: DragEvent, columnId: string): void {
    dragOverHidden = null;
    dnd.onDrop(e, columnId);
    show(columnId);
  }

  return {
    get hiddenSet() {
      return hiddenSet;
    },
    get railOpen() {
      return railOpen;
    },
    set railOpen(value: boolean) {
      railOpen = value;
    },
    get dragOverHidden() {
      return dragOverHidden;
    },
    set dragOverHidden(value: string | null) {
      dragOverHidden = value;
    },
    collapsing,
    expanding,
    leaving,
    hide,
    show,
    showAll,
    onHiddenDragOver,
    onHiddenDragLeave,
    onHiddenDrop,
  };
}

export type KanbanRailState = ReturnType<typeof createKanbanRailState>;
