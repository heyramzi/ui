<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import KanbanColumn from "./kanban-column.svelte";
	import { liftDragImage } from "./kanban-drag.js";
	import { boardOrderAt } from "./board-order.js";
	import { cn } from "./lib/cn.js";
	import { createKanbanDnd } from "./use-kanban-dnd.svelte.js";
	import type {
		KanbanCardContext,
		KanbanColumn as KanbanColumnDef,
		KanbanColumnContext,
		KanbanMove,
		KanbanSortKey,
	} from "./kanban-types.js";

	type Props<T> = {
		columns: KanbanColumnDef[];
		items: T[];
		/** The stable id of a card. Used for keys, drag payloads and move events. */
		getId: (item: T) => string;
		/** The column id a card belongs to. */
		getColumn: (item: T) => string;
		/** Called on drop with what to persist. Awaited, so the caller can save. */
		onMove: (id: string, move: KanbanMove) => void | Promise<void>;
		renderCard: Snippet<[T, KanbanCardContext]>;
		/** Reads a card's manual order key. Required for `sortKey="manual"` ordering. */
		boardOrder?: (item: T) => string | null | undefined;
		/** Extra named sorts, e.g. by title or owner. `manual` is always available. */
		sortKeys?: KanbanSortKey<T>[];
		/** The active sort. `"manual"` (default) orders by `boardOrder`. */
		sortKey?: string;
		/** Optional column header. Defaults to the label plus a count. */
		columnHeader?: Snippet<[KanbanColumnDef, KanbanColumnContext]>;
		emptyLabel?: string;
		/** A capped column is one whose tail is hidden, so its empty space drops on top. */
		dropAtTop?: (columnId: string) => boolean;
		/**
		 * Override per-column drop targets. Defaults to each column's `droppable`
		 * flag (true when unset). A column it returns false for never calls
		 * preventDefault, so it is not a drop target.
		 */
		isDroppable?: (columnId: string) => boolean;
		class?: string;
	};

	let {
		columns,
		items,
		getId,
		getColumn,
		onMove,
		renderCard,
		boardOrder,
		sortKeys = [],
		sortKey = "manual",
		columnHeader,
		emptyLabel = "Nothing here yet",
		dropAtTop,
		isDroppable,
		class: className,
	}: Props<T> = $props();

	let slotHeight = $state(0);

	function compare(a: T, b: T): number {
		if (sortKey === "manual") {
			if (!boardOrder) return 0;
			const ao = boardOrder(a);
			const bo = boardOrder(b);
			if (ao == null && bo == null) return 0;
			if (ao == null) return 1;
			if (bo == null) return -1;
			return ao < bo ? -1 : ao > bo ? 1 : 0;
		}
		const key = sortKeys.find((entry) => entry.id === sortKey);
		return key ? key.compare(a, b) : 0;
	}

	function sortedByColumn(columnId: string): T[] {
		return items
			.filter((item) => getColumn(item) === columnId)
			.slice()
			.sort(compare);
	}

	function idAt(list: T[], index: number): string | null {
		const item = list[index];
		return item === undefined ? null : getId(item);
	}

	const dnd = createKanbanDnd<T>({
		items: () => items,
		getId: (item) => getId(item),
		getColumn: (item) => getColumn(item),
		getColumnItems: sortedByColumn,
		getSortKey: () => sortKey,
		boardOrder: (item) => boardOrder?.(item),
		onMove: (id, move) => onMove(id, move),
		dropAtTop: (columnId) => dropAtTop?.(columnId) ?? false,
		isDroppable: (columnId) =>
			isDroppable?.(columnId) ??
			(columns.find((c) => c.id === columnId)?.droppable ?? true),
	});

	/**
	 * Keyboard move: Alt + ArrowLeft/Right drops the focused card in the
	 * adjacent droppable column. Native drag stays the primary path; this
	 * covers keyboard and touch-reader users with the same onMove contract.
	 */
	function onCardKeyDown(e: KeyboardEvent, id: string): void {
		if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
		const item = items.find((entry) => getId(entry) === id);
		if (!item) return;
		const current = getColumn(item);
		const at = columns.findIndex((c) => c.id === current);
		if (at === -1) return;
		const dir = e.key === "ArrowRight" ? 1 : -1;
		const canDrop = (columnId: string) =>
			isDroppable?.(columnId) ??
			(columns.find((c) => c.id === columnId)?.droppable ?? true);
		for (let i = at + dir; i >= 0 && i < columns.length; i += dir) {
			const target = columns[i];
			if (!canDrop(target.id) || target.id === current) continue;
			e.preventDefault();
			if (sortKey === "manual" && boardOrder) {
				const column = sortedByColumn(target.id).filter(
					(entry) => getId(entry) !== id,
				);
				void onMove(id, {
					columnId: target.id,
					boardOrder: boardOrderAt(column, column.length, (entry) =>
						boardOrder(entry),
					),
				});
			} else {
				void onMove(id, { columnId: target.id });
			}
			return;
		}
	}

	let view = $derived(columns.map((column) => ({ column, cards: sortedByColumn(column.id) })));
</script>

<div
	class={cn(
		"kanban-board flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-2",
		"max-sm:-mx-4 max-sm:snap-x max-sm:snap-proximity max-sm:scroll-px-4 max-sm:px-4",
		className,
	)}
>
	{#each view as { column, cards } (column.id)}
		{@const active = dnd.dragOver?.columnId === column.id}
		<KanbanColumn
			hue={column.hue}
			{active}
			ariaLabel={column.ariaLabel ?? column.label}
			ondragover={(e) => dnd.onColumnDragOver(e, column.id)}
			ondragleave={dnd.onDragLeave}
			ondrop={(e) => dnd.onDrop(e, column.id)}
		>
			{#snippet header()}
				{#if columnHeader}
					{@render columnHeader(column, { count: cards.length, active })}
				{:else}
					<span class="truncate text-sm font-medium text-foreground">{column.label}</span>
					<span
						class="grid h-5 min-w-5 place-items-center rounded-sm bg-foreground/5 px-1 text-xs font-medium text-muted-foreground tabular-nums"
					>
						{cards.length}
					</span>
				{/if}
			{/snippet}

			{#each cards as item, index (getId(item))}
				{@const id = getId(item)}
				{#if dnd.showIndicatorBefore(column.id, id) && !dnd.isDragSource(id) && idAt(cards, index - 1) !== dnd.draggedId}
					<div
						class="kanban-drop-slot"
						aria-hidden="true"
						style:height="{slotHeight}px"
						ondragover={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					></div>
				{/if}
				<div
					role="listitem"
					tabindex="0"
					aria-label="Card. Press Alt plus Left or Right arrow to move between columns."
					draggable="true"
					ondragstart={(e) => {
						slotHeight = e.currentTarget.getBoundingClientRect().height;
						liftDragImage(e);
						dnd.onDragStart(e, id);
					}}
					ondragend={() => dnd.resetDrag()}
					ondragover={(e) => dnd.onItemDragOver(e, column.id, id, idAt(cards, index + 1))}
					onkeydown={(e) => onCardKeyDown(e, id)}
					class={cn(
						"kanban-card cursor-grab active:cursor-grabbing",
						dnd.isDragSource(id) && "opacity-40",
					)}
				>
					{@render renderCard(item, { columnId: column.id, index })}
				</div>
			{/each}

			{#if dnd.showIndicatorEnd(column.id) && idAt(cards, cards.length - 1) !== dnd.draggedId}
				<div
					class="kanban-drop-slot"
					aria-hidden="true"
					style:height="{slotHeight}px"
					ondragover={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				></div>
			{/if}

			{#if cards.length === 0 && !active}
				<div
					class="rounded-xl border-2 border-dashed border-border py-6 text-center text-xs text-muted-foreground"
				>
					{emptyLabel}
				</div>
			{/if}
		</KanbanColumn>
	{/each}
</div>

<style>
	.kanban-drop-slot {
		flex-shrink: 0;
		min-height: 2.5rem;
		border-radius: var(--radius-lg, 0.5rem);
		background: color-mix(in oklch, var(--color-muted, #e5e7eb) 70%, transparent);
		outline: 1px dashed var(--color-border, #d1d5db);
		outline-offset: -1px;
		transition: height var(--duration-quick, 120ms) var(--ease-smooth-out, ease-out);
	}
</style>
