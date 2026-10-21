<script lang="ts" generics="T, C extends KanbanColumnDef = KanbanColumnDef">
	import type { Snippet } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { prefersReducedMotion } from "svelte/motion";
	import { cubicOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import KanbanColumn from "#src/kanban-column.svelte";
	import { liftDragImage } from "#src/kanban-drag.js";
	import { boardOrderAt } from "#src/board-order.js";
	import { cn } from "@heyramzi/utils";
	import { createKanbanDnd } from "#src/use-kanban-dnd.svelte.js";
	import { CaretDown } from "phosphor-svelte";
	import type {
		KanbanCardContext,
		KanbanColumn as KanbanColumnDef,
		KanbanColumnContext,
		KanbanMove,
		KanbanSortKey,
	} from "#src/kanban-types.js";

	interface Props<T, C extends KanbanColumnDef> {
		/** Plain column defs, or your own type that extends one. Snippets get it back as you passed it. */
		columns: C[];
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
		/** Breaks a tie in manual order: two cards with the same key, or both without one. */
		manualTiebreak?: (a: T, b: T) => number;
		/** Extra named sorts, e.g. by title or owner. `manual` is always available. */
		sortKeys?: KanbanSortKey<T>[];
		/** The active sort. `"manual"` (default) orders by `boardOrder`, else by the order of `items`. */
		sortKey?: string;
		/** Optional column header. Defaults to the label plus a count. */
		columnHeader?: Snippet<[C, KanbanColumnContext]>;
		/** Rendered under a column's cards, e.g. a "Show all 12" or an add button. */
		columnFooter?: Snippet<[C, KanbanColumnContext]>;
		/**
		 * Wraps a whole column, for a context menu or a tooltip around it. Render `column` once and
		 * spread the `props` it hands you, so the wrapper's trigger lands on the column.
		 */
		wrapColumn?: Snippet<[C, Snippet<[Record<string, unknown>]>]>;
		/** Enter or Space on a focused card. Leave out when the card holds its own links and buttons. */
		onSelect?: (id: string) => void;
		/** The screen-reader name of a card. Defaults to a hint about the keyboard move. */
		getLabel?: (item: T) => string;
		emptyLabel?: string;
		/**
		 * Cards a column shows before the rest fold behind a footer. Return undefined for no cap.
		 * A capped column's empty space drops on top, since the tail is out of sight.
		 */
		limit?: (columnId: string) => number | undefined;
		/** Column ids whose `limit` is lifted. Controlled; leave out to let the board remember. */
		expanded?: string[];
		onExpandedChange?: (ids: string[]) => void;
		/** Column ids folded into the rail on the right. Controlled; leave out to let the board remember. */
		hidden?: string[];
		onHiddenChange?: (ids: string[]) => void;
		/** Heading over the rail of hidden columns. */
		hiddenLabel?: string;
		/** The rail's button that brings every hidden column back. */
		showAllLabel?: string;
		/** Content of one entry in the hidden rail. Defaults to the label and a count. */
		hiddenItem?: Snippet<[C, { count: number; active: boolean }]>;
		/** A capped column is one whose tail is hidden, so its empty space drops on top. Overrides `limit`. */
		dropAtTop?: (columnId: string) => boolean;
		/**
		 * Override per-column drop targets. Defaults to each column's `droppable`
		 * flag (true when unset). A column it returns false for never calls
		 * preventDefault, so it is not a drop target.
		 */
		isDroppable?: (columnId: string) => boolean;
		class?: string;
	}

	let {
		columns,
		items,
		getId,
		getColumn,
		onMove,
		renderCard,
		boardOrder,
		manualTiebreak,
		sortKeys = [],
		sortKey = "manual",
		columnHeader,
		columnFooter,
		wrapColumn,
		getLabel,
		onSelect,
		emptyLabel = "Nothing here yet",
		limit,
		expanded,
		onExpandedChange,
		hidden,
		onHiddenChange,
		hiddenLabel = "Hidden columns",
		showAllLabel = "Show all",
		hiddenItem,
		dropAtTop,
		isDroppable,
		class: className,
	}: Props<T, C> = $props();

	// The drop slot takes the held card's height, so the column doesn't jump when it lands.
	let slotHeight = $state(0);
	let slotMotion = $derived({ duration: prefersReducedMotion.current ? 0 : 180, easing: cubicOut });

	let internalExpanded = $state<string[]>([]);
	let internalHidden = $state<string[]>([]);
	let expandedIds = $derived(expanded ?? internalExpanded);
	let hiddenIds = $derived(hidden ?? internalHidden);
	let hiddenSet = $derived(new Set(hiddenIds));

	let railOpen = $state(true);
	let dragOverHidden = $state<string | null>(null);
	const collapsing = new SvelteSet<string>();
	const expanding = new SvelteSet<string>();
	const leaving = new SvelteSet<string>();

	function compare(a: T, b: T): number {
		if (sortKey === "manual") {
			const tie = manualTiebreak?.(a, b) ?? 0;
			if (!boardOrder) return tie;
			const ao = boardOrder(a);
			const bo = boardOrder(b);
			if (ao == null && bo == null) return tie;
			if (ao == null) return 1;
			if (bo == null) return -1;
			return ao < bo ? -1 : ao > bo ? 1 : tie;
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

	function isCapped(columnId: string, total: number): boolean {
		const cap = limit?.(columnId);
		return cap !== undefined && !expandedIds.includes(columnId) && total > cap;
	}

	function canDrop(columnId: string): boolean {
		return isDroppable?.(columnId) ?? (columns.find((c) => c.id === columnId)?.droppable ?? true);
	}

	function expand(columnId: string): void {
		if (expandedIds.includes(columnId)) return;
		const next = [...expandedIds, columnId];
		internalExpanded = next;
		onExpandedChange?.(next);
	}

	function setHidden(next: string[]): void {
		internalHidden = next;
		onHiddenChange?.(next);
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

	const dnd = createKanbanDnd<T>({
		items: () => items,
		getId: (item) => getId(item),
		getColumn: (item) => getColumn(item),
		getColumnItems: sortedByColumn,
		getSortKey: () => sortKey,
		boardOrder: (item) => boardOrder?.(item),
		onMove: (id, move) => onMove(id, move),
		dropAtTop: (columnId) =>
			dropAtTop?.(columnId) ?? isCapped(columnId, sortedByColumn(columnId).length),
		isDroppable: canDrop,
	});

	/**
	 * Keyboard move: Alt + ArrowLeft/Right drops the focused card in the
	 * adjacent droppable column. Native drag stays the primary path; this
	 * covers keyboard and touch-reader users with the same onMove contract.
	 */
	function onCardKeyDown(e: KeyboardEvent, id: string): void {
		if (onSelect && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			onSelect(id);
			return;
		}
		if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
		const item = items.find((entry) => getId(entry) === id);
		if (!item) return;
		const current = getColumn(item);
		const at = columns.findIndex((c) => c.id === current);
		if (at === -1) return;
		const dir = e.key === "ArrowRight" ? 1 : -1;
		for (let i = at + dir; i >= 0 && i < columns.length; i += dir) {
			const target = columns[i];
			if (!canDrop(target.id) || hiddenSet.has(target.id) || target.id === current) continue;
			e.preventDefault();
			if (sortKey === "manual") {
				const column = sortedByColumn(target.id).filter((entry) => getId(entry) !== id);
				const atTop = dropAtTop?.(target.id) ?? isCapped(target.id, column.length + 1);
				const index = atTop ? 0 : column.length;
				const before = column[index - 1];
				const after = column[index];
				void onMove(id, {
					columnId: target.id,
					...(boardOrder
						? { boardOrder: boardOrderAt(column, index, (entry) => boardOrder(entry)) }
						: {}),
					beforeId: before === undefined ? null : getId(before),
					afterId: after === undefined ? null : getId(after),
				});
			} else {
				void onMove(id, { columnId: target.id });
			}
			return;
		}
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

	let view = $derived(
		columns.map((column) => {
			const all = sortedByColumn(column.id);
			const capped = isCapped(column.id, all.length);
			const cap = limit?.(column.id);
			return {
				column,
				all,
				cards: capped && cap !== undefined ? all.slice(0, cap) : all,
				capped,
			};
		}),
	);

	let hiddenColumns = $derived(columns.filter((column) => hiddenSet.has(column.id)));

	function contextOf(
		column: C,
		all: T[],
		cards: T[],
		capped: boolean,
		active: boolean,
	): KanbanColumnContext {
		return {
			count: all.length,
			active,
			shown: cards.length,
			capped,
			hide: () => hide(column.id),
			expand: () => expand(column.id),
		};
	}
</script>

<!-- The slot keeps the drag state where it is, or hovering it would bubble to the column and jump it to the end. -->
{#snippet dropSlot()}
	<div
		class="kanban-drop-slot"
		aria-hidden="true"
		style:height="{slotHeight}px"
		transition:slide={slotMotion}
		ondragover={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}
	></div>
{/snippet}

{#snippet columnShell(
	column: C,
	all: T[],
	cards: T[],
	capped: boolean,
	extra: Record<string, unknown>,
)}
	{@const active = dnd.dragOver?.columnId === column.id}
	{@const context = contextOf(column, all, cards, capped, active)}
	<KanbanColumn
		{...extra}
		hue={column.hue}
		{active}
		collapsing={collapsing.has(column.id)}
		expanding={expanding.has(column.id)}
		ariaLabel={column.ariaLabel ?? column.label}
		ondragover={(e) => dnd.onColumnDragOver(e, column.id)}
		ondragleave={dnd.onDragLeave}
		ondrop={(e) => dnd.onDrop(e, column.id)}
	>
		{#snippet header()}
			{#if columnHeader}
				{@render columnHeader(column, context)}
			{:else}
				<span class="truncate text-sm font-medium text-foreground">{column.label}</span>
				<span
					class="grid h-5 min-w-5 place-items-center rounded-sm bg-foreground/5 px-1 text-xs font-medium text-muted-foreground tabular-nums"
				>
					{all.length}
				</span>
			{/if}
		{/snippet}

		{#each cards as item, index (getId(item))}
			{@const id = getId(item)}
			{@const nextId = idAt(cards, index + 1)}
			{@const isSource = dnd.isDragSource(id)}
			<!-- The slot right after the held card is its own spot, so the card's place shows it instead. -->
			{@const atOrigin =
				!dnd.dragOver || (dnd.dragOver.columnId === column.id && dnd.dragOver.overId === nextId)}
			{#if dnd.showIndicatorBefore(column.id, id) && !isSource && idAt(cards, index - 1) !== dnd.draggedId}
				{@render dropSlot()}
			{/if}
			<!-- WHY: a card is a list item that takes focus for the Alt+arrow move; making it a button would hide the list from screen readers. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
			<div
				role="listitem"
				tabindex="0"
				aria-label={getLabel?.(item) ?? "Card. Press Alt plus Left or Right arrow to move between columns."}
				aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
				draggable="true"
				ondragstart={(e) => {
					slotHeight = e.currentTarget.getBoundingClientRect().height;
					liftDragImage(e);
					dnd.onDragStart(e, id);
				}}
				ondragend={() => {
					dnd.resetDrag();
					dragOverHidden = null;
				}}
				ondragover={(e) => dnd.onItemDragOver(e, column.id, id, nextId)}
				onkeydown={(e) => onCardKeyDown(e, id)}
				class={cn(
					"kanban-card cursor-grab rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-grabbing",
					isSource && (atOrigin ? "kanban-origin-slot" : "kanban-lifted-out"),
				)}
			>
				{@render renderCard(item, { columnId: column.id, index })}
			</div>
		{/each}

		{#if dnd.showIndicatorEnd(column.id) && idAt(cards, cards.length - 1) !== dnd.draggedId}
			{@render dropSlot()}
		{/if}

		{#if columnFooter}
			{@render columnFooter(column, context)}
		{/if}

		{#if cards.length === 0 && !active}
			<div
				class="rounded-xl border-2 border-dashed border-border py-6 text-center text-xs text-muted-foreground"
			>
				{emptyLabel}
			</div>
		{/if}
	</KanbanColumn>
{/snippet}

<div
	class={cn(
		"kanban-board flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-2",
		"max-sm:-mx-4 max-sm:snap-x max-sm:snap-proximity max-sm:scroll-px-4 max-sm:px-4",
		className,
	)}
>
	{#each view as { column, all, cards, capped } (column.id)}
		{#if !hiddenSet.has(column.id) || collapsing.has(column.id)}
			{#if wrapColumn}
				{#snippet inner(props: Record<string, unknown>)}
					{@render columnShell(column, all, cards, capped, props)}
				{/snippet}
				{@render wrapColumn(column, inner)}
			{:else}
				{@render columnShell(column, all, cards, capped, {})}
			{/if}
		{/if}
	{/each}

	{#if hiddenColumns.length > 0}
		<div class="kanban-rail flex w-40 shrink-0 flex-col gap-1">
			<button
				type="button"
				aria-expanded={railOpen}
				onclick={() => (railOpen = !railOpen)}
				class="flex h-8 items-center gap-1.5 rounded-md px-2 text-start text-xs text-muted-foreground outline-none transition-colors duration-[var(--duration-quick,120ms)] hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/60"
			>
				<span
					class={cn(
						"size-2.5 transition-transform duration-[var(--duration-fast,160ms)] ease-[var(--ease-smooth-out,ease-out)] [&>svg]:size-full",
						!railOpen && "-rotate-90",
					)}
					aria-hidden="true"><CaretDown weight="bold" /></span
				>
				{hiddenLabel}
			</button>

			{#if railOpen}
				<div class="flex flex-col gap-0.5">
					{#each hiddenColumns as column (column.id)}
						{@const count = sortedByColumn(column.id).length}
						{@const over = dragOverHidden === column.id}
						{@const hue = column.hue ?? "var(--color-primary)"}
						<div
							role="region"
							aria-label={column.ariaLabel ?? column.label}
							class={cn(
								"kanban-rail-item rounded-md transition-[background-color,outline-color] duration-[var(--duration-quick,120ms)] ease-[var(--ease-smooth-out,ease-out)]",
								leaving.has(column.id) && "kanban-rail-item-leaving",
							)}
							style:background="color-mix(in oklch, {hue} {over ? 10 : 0}%, transparent)"
							style:outline="1px solid color-mix(in oklch, {hue} {over ? 28 : 0}%, transparent)"
							ondragover={(e) => onHiddenDragOver(e, column.id)}
							ondragleave={onHiddenDragLeave}
							ondrop={(e) => onHiddenDrop(e, column.id)}
						>
							<button
								type="button"
								onclick={() => show(column.id)}
								class="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-start text-xs font-medium text-muted-foreground outline-none transition-colors duration-[var(--duration-quick,120ms)] hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/60"
							>
								{#if hiddenItem}
									{@render hiddenItem(column, { count, active: over })}
								{:else}
									<span class="truncate whitespace-nowrap">{column.label}</span>
									{#if count > 0}
										<span class="ms-auto text-xs text-muted-foreground/60 tabular-nums">{count}</span>
									{/if}
								{/if}
							</button>
						</div>
					{/each}

					{#if hiddenColumns.length > 1}
						<button
							type="button"
							onclick={showAll}
							class="mt-1 flex h-8 items-center rounded-md px-2.5 text-start text-xs text-muted-foreground outline-none transition-colors duration-[var(--duration-quick,120ms)] hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/60"
						>
							{showAllLabel}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* The drop slot and the held card's own place share a look: a dashed hole the card's size. */
	.kanban-drop-slot,
	.kanban-origin-slot {
		border-radius: var(--radius-lg, 0.5rem);
		background: color-mix(in oklch, var(--color-muted, #e5e7eb) 70%, transparent);
		outline: 1px dashed var(--color-border, #d1d5db);
		outline-offset: -1px;
	}

	.kanban-drop-slot {
		flex-shrink: 0;
		min-height: 2.5rem;
	}

	/* A grid row folds the card out of the column smoothly, so the cards below slide up. */
	.kanban-card {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 1fr;
		transition:
			grid-template-rows var(--duration-quick, 180ms) var(--ease-smooth-out, ease-out),
			margin-top var(--duration-quick, 180ms) var(--ease-smooth-out, ease-out);
	}

	.kanban-card > :global(*) {
		min-height: 0;
	}

	.kanban-origin-slot > :global(*) {
		visibility: hidden;
	}

	/* -0.375rem cancels the column's gap-1.5, so a folded card leaves no gap behind. */
	.kanban-lifted-out {
		grid-template-rows: 0fr;
		margin-top: -0.375rem;
	}

	.kanban-lifted-out > :global(*) {
		overflow: hidden;
		visibility: hidden;
	}

	.kanban-rail-item-leaving {
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--duration-quick, 120ms) var(--ease-smooth-out, ease-out);
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-card {
			transition: none;
		}
	}
</style>
