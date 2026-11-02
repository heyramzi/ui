<script lang="ts" generics="T, C extends KanbanColumnDef = KanbanColumnDef">
	import { untrack, type Snippet } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { prefersReducedMotion } from "svelte/motion";
	import { durationMs } from "#src/lib/motion.js";
	import { cubicOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import KanbanColumn from "#src/work/kanban-column.svelte";
	import { liftDragImage } from "#src/work/kanban-drag.js";
	import { boardOrderAt } from "#src/work/board-order.js";
	import { cn } from "#src/lib/utils.js";
	import { createKanbanDnd } from "#src/work/use-kanban-dnd.svelte.js";
	import { CaretDown } from "phosphor-svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import GroupHead from "#src/components/work-parts/group-head.svelte";
	import { workLooks } from "#src/components/work-parts/looks.js";
	import type {
		KanbanCardContext,
		KanbanColumn as KanbanColumnDef,
		KanbanColumnContext,
		KanbanMove,
		KanbanSortKey,
	} from "#src/work/kanban-types.js";

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
		 * Wraps a column for a context menu or tooltip: render `column` once and spread the
		 * `props` it hands you, so the trigger lands on the column.
		 */
		wrapColumn?: Snippet<[C, Snippet<[Record<string, unknown>]>]>;
		/** Enter or Space on a focused card. Leave out when the card holds its own links and buttons. */
		onSelect?: (id: string) => void;
		/** The screen-reader name of a card. Defaults to a hint about the keyboard move. */
		getLabel?: (item: T) => string;
		emptyLabel?: string;
		/** Shows a plus in each default column head that adds a card to that column. */
		onAdd?: (columnId: string) => void;
		/** The plus button's accessible name, followed by the column label. */
		addLabel?: string;
		/**
		 * Cards a column shows before the rest fold behind "Show N more": a number for every
		 * column, or per column (undefined for no cap). `Infinity` turns the fold off.
		 */
		limit?: number | ((columnId: string) => number | undefined);
		/** The fold's open button, given how many cards it holds. */
		moreLabel?: (hidden: number) => string;
		/** The fold's close button. */
		lessLabel?: string;
		/** The header caret's open and close names, followed by the column label. */
		expandColumnLabel?: string;
		collapseColumnLabel?: string;
		/**
		 * Column ids the header caret opened. Pass one array to every board in a stack of
		 * swimlanes, so the caret opens that column in each. "Show N more" stays per board.
		 */
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
		onAdd,
		addLabel = "Add a card",
		limit = 5,
		moreLabel = (hidden) => `Show ${hidden} more`,
		lessLabel = "Show less",
		expandColumnLabel = "Show every card in",
		collapseColumnLabel = "Fold back",
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
	let slotMotion = $derived({
		duration: prefersReducedMotion.current ? 0 : durationMs("quick"),
		easing: cubicOut,
	});

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

	function capOf(columnId: string): number | undefined {
		return typeof limit === "function" ? limit(columnId) : limit;
	}

	/** The column holds more cards than its cap, so it gets a fold. */
	function isFoldable(columnId: string, total: number): boolean {
		const cap = capOf(columnId);
		return cap !== undefined && total > cap;
	}

	// Open from this board's "Show N more", on top of the header caret's `expanded`.
	const laneOpen = new SvelteSet<string>();

	function isOpen(columnId: string): boolean {
		return expandedIds.includes(columnId) || laneOpen.has(columnId);
	}

	/** The fold is shut, so the tail is out of sight. */
	function isCapped(columnId: string, total: number): boolean {
		return isFoldable(columnId, total) && !isOpen(columnId);
	}

	// A card moved into a folded column stays in view, wherever its sort puts it.
	const pinned = new SvelteSet<string>();

	// The caret folding a column shuts this board's own fold of it too, so every lane lands on the cap.
	let previousExpanded: string[] = [];
	$effect(() => {
		const now = expandedIds;
		untrack(() => {
			for (const id of previousExpanded) if (!now.includes(id)) shut(id);
		});
		previousExpanded = [...now];
	});

	function moveAndPin(id: string, move: KanbanMove): void | Promise<void> {
		pinned.add(id);
		return onMove(id, move);
	}

	function canDrop(columnId: string): boolean {
		return isDroppable?.(columnId) ?? columns.find((c) => c.id === columnId)?.droppable ?? true;
	}

	function setExpanded(next: string[]): void {
		internalExpanded = next;
		onExpandedChange?.(next);
	}

	// Shutting drops the column's pins, so the fold closes to exactly its cap.
	function shut(columnId: string): void {
		laneOpen.delete(columnId);
		for (const item of sortedByColumn(columnId)) pinned.delete(getId(item));
	}

	/** "Show N more": opens this board's cell only. */
	function expand(columnId: string): void {
		laneOpen.add(columnId);
	}

	/** "Show less": shuts this board's cell, and lifts the caret's open if it was the caret's. */
	function collapse(columnId: string): void {
		shut(columnId);
		if (expandedIds.includes(columnId)) setExpanded(expandedIds.filter((id) => id !== columnId));
	}

	/** The header caret: the whole column, in every board that shares `expanded`. */
	function toggleColumn(columnId: string): void {
		if (expandedIds.includes(columnId)) collapse(columnId);
		else setExpanded([...expandedIds, columnId]);
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
		onMove: moveAndPin,
		dropAtTop: (columnId) =>
			dropAtTop?.(columnId) ?? isCapped(columnId, sortedByColumn(columnId).length),
		isDroppable: canDrop,
	});

	/**
	 * Alt + ArrowLeft/Right moves the focused card to the next droppable column, so
	 * keyboard and screen-reader users get drag's onMove contract.
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
				void moveAndPin(id, {
					columnId: target.id,
					...(boardOrder
						? { boardOrder: boardOrderAt(column, index, (entry) => boardOrder(entry)) }
						: {}),
					beforeId: before === undefined ? null : getId(before),
					afterId: after === undefined ? null : getId(after),
				});
			} else {
				void moveAndPin(id, { columnId: target.id });
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
			const cap = capOf(column.id);
			const foldable = isFoldable(column.id, all.length);
			const open = foldable && isOpen(column.id);
			if (!foldable || cap === undefined) {
				return { column, all, head: all, tail: [] as T[], foldable, open, capped: false };
			}
			// Head: the first `cap` cards plus any pinned ones, in sort order. The fold holds the rest.
			const head: T[] = [];
			const tail: T[] = [];
			all.forEach((item, index) => {
				(index < cap || pinned.has(getId(item)) ? head : tail).push(item);
			});
			return { column, all, head, tail, foldable, open, capped: !open && tail.length > 0 };
		}),
	);

	let hiddenColumns = $derived(columns.filter((column) => hiddenSet.has(column.id)));

	type ColumnView = (typeof view)[number];

	function contextOf(entry: ColumnView, active: boolean): KanbanColumnContext {
		const { column, all, head, capped } = entry;
		return {
			count: all.length,
			active,
			shown: capped ? head.length : all.length,
			capped,
			hide: () => hide(column.id),
			expand: () => expand(column.id),
			collapse: () => collapse(column.id),
		};
	}
</script>

<!-- The slot keeps the drag state where it is, or hovering it would bubble to the column and jump it to the end. -->
{#snippet dropSlot()}
	<div
		class={cn("kanban-drop-slot min-h-10 shrink-0", workLooks.hole)}
		aria-hidden="true"
		style:height="{slotHeight}px"
		transition:slide={slotMotion}
		ondragover={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}
	></div>
{/snippet}

{#snippet card(column: C, item: T, index: number, list: T[])}
	{@const id = getId(item)}
	{@const nextId = idAt(list, index + 1)}
	{@const isSource = dnd.isDragSource(id)}
	<!-- The slot right after the held card is its own spot, so the card's place shows it instead. -->
	{@const atOrigin =
		!dnd.dragOver || (dnd.dragOver.columnId === column.id && dnd.dragOver.overId === nextId)}
	{#if dnd.showIndicatorBefore(column.id, id) && !isSource && idAt(list, index - 1) !== dnd.draggedId}
		{@render dropSlot()}
	{/if}
	<!-- WHY: a card is a list item that takes focus for the Alt+arrow move; making it a button would hide the list from screen readers. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		role="listitem"
		tabindex="0"
		aria-label={getLabel?.(item) ??
			"Card. Press Alt plus Left or Right arrow to move between columns."}
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
			"kanban-card cursor-grab outline-none focus-visible:shadow-(--ring-focus) active:cursor-grabbing",
			workLooks.card,
			isSource && (atOrigin ? cn("kanban-origin-slot", workLooks.hole) : "kanban-lifted-out"),
		)}
	>
		{@render renderCard(item, { columnId: column.id, index })}
	</div>
{/snippet}

{#snippet columnShell(entry: ColumnView, extra: Record<string, unknown>)}
	{@const { column, all, head, tail, open, capped } = entry}
	{@const active = dnd.dragOver?.columnId === column.id}
	{@const context = contextOf(entry, active)}
	{@const showTail = tail.length > 0}
	{@const list = [...head, ...tail]}
	{@const columnOpen = expandedIds.includes(column.id)}
	{@const shown = capped ? head : list}
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
				<GroupHead
					label={column.label}
					hue={column.hue}
					count={all.length}
					onAdd={onAdd ? () => onAdd(column.id) : undefined}
					{addLabel}
				/>
			{/if}
			{#if entry.foldable}
				<!-- Opens the column in every lane; "Show N more" opens one. Hiding into the rail stays the header's own button. -->
				<Button
					variant="ghost"
					size="sm"
					icon
					aria-expanded={columnOpen}
					aria-label="{columnOpen ? collapseColumnLabel : expandColumnLabel} {column.label}"
					onclick={() => toggleColumn(column.id)}
					class="-me-1 ms-auto size-6 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity duration-(--duration-quick) hover:text-foreground focus-visible:opacity-100 [.kanban-column:hover_&]:opacity-100 [@media(hover:none)]:opacity-100"
				>
					<span
						class={cn(
							"kanban-fold-chevron size-3 [&>svg]:size-full",
							columnOpen && "kanban-fold-chevron-open",
						)}
						aria-hidden="true"><CaretDown weight="bold" /></span
					>
				</Button>
			{/if}
		{/snippet}

		{#each head as item, index (getId(item))}
			{@render card(column, item, index, list)}
		{/each}

		{#if showTail}
			<!-- The tail sits shut in a 0fr row, so opening and closing animate its height. -->
			<div class="kanban-fold" data-open={open} inert={!open}>
				<div class="kanban-fold-inner">
					{#each tail as item, index (getId(item))}
						{@render card(column, item, head.length + index, list)}
					{/each}
				</div>
			</div>
		{/if}

		{#if dnd.showIndicatorEnd(column.id) && idAt(shown, shown.length - 1) !== dnd.draggedId}
			{@render dropSlot()}
		{/if}

		{#if tail.length > 0 || open}
			<Button
				variant="ghost"
				size="sm"
				aria-expanded={open}
				onclick={() => (open ? collapse(column.id) : expand(column.id))}
				class="shrink-0 justify-start gap-1.5 px-2 text-xs font-normal text-muted-foreground"
			>
				<span
					class={cn(
						"kanban-fold-chevron size-2.5 [&>svg]:size-full",
						open && "kanban-fold-chevron-open",
					)}
					aria-hidden="true"><CaretDown weight="bold" /></span
				>
				<span class="tabular-nums">{open ? lessLabel : moreLabel(tail.length)}</span>
			</Button>
		{/if}

		{#if columnFooter}
			{@render columnFooter(column, context)}
		{/if}

		{#if all.length === 0 && !active}
			<div class={cn(workLooks.hole, "py-6 text-center text-xs text-muted-foreground")}>
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
	{#each view as entry (entry.column.id)}
		{@const column = entry.column}
		{#if !hiddenSet.has(column.id) || collapsing.has(column.id)}
			{#if wrapColumn}
				{#snippet inner(props: Record<string, unknown>)}
					{@render columnShell(entry, props)}
				{/snippet}
				{@render wrapColumn(column, inner)}
			{:else}
				{@render columnShell(entry, {})}
			{/if}
		{/if}
	{/each}

	{#if hiddenColumns.length > 0}
		<div class="kanban-rail flex w-40 shrink-0 flex-col gap-1">
			<Button
				variant="ghost"
				size="sm"
				aria-expanded={railOpen}
				onclick={() => (railOpen = !railOpen)}
				class="justify-start px-2 text-xs font-normal text-muted-foreground"
			>
				<span
					class={cn(
						"size-2.5 transition-transform duration-fast ease-smooth-out motion-reduce:transition-none [&>svg]:size-full",
						!railOpen && "-rotate-90",
					)}
					aria-hidden="true"><CaretDown weight="bold" /></span
				>
				{hiddenLabel}
			</Button>

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
								"kanban-rail-item transition-[background-color,outline-color] duration-quick ease-smooth-out",
								workLooks.row,
								leaving.has(column.id) && "kanban-rail-item-leaving",
							)}
							style:background="color-mix(in oklch, {hue}
							{over ? 10 : 0}%, transparent)"
							style:outline="1px solid color-mix(in oklch, {hue}
							{over ? 28 : 0}%, transparent)"
							ondragover={(e) => onHiddenDragOver(e, column.id)}
							ondragleave={onHiddenDragLeave}
							ondrop={(e) => onHiddenDrop(e, column.id)}
						>
							<Button
								variant="ghost"
								size="lg"
								onclick={() => show(column.id)}
								class="w-full justify-start gap-2 text-xs text-muted-foreground"
							>
								{#if hiddenItem}
									{@render hiddenItem(column, { count, active: over })}
								{:else}
									<span class="truncate whitespace-nowrap">{column.label}</span>
									{#if count > 0}
										<span class="ms-auto text-xs text-muted-foreground/60 tabular-nums"
											>{count.toLocaleString()}</span
										>
									{/if}
								{/if}
							</Button>
						</div>
					{/each}

					{#if hiddenColumns.length > 1}
						<Button
							variant="ghost"
							size="sm"
							onclick={showAll}
							class="mt-1 justify-start text-xs font-normal text-muted-foreground"
						>
							{showAllLabel}
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* A grid row folds the card out of the column smoothly, so the cards below slide up. */
	.kanban-card {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 1fr;
		transition:
			grid-template-rows var(--duration-quick) var(--ease-smooth-out),
			margin-top var(--duration-quick) var(--ease-smooth-out);
	}

	.kanban-card > :global(*) {
		min-height: 0;
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

	/* The fold: height rides grid-template-rows 0fr to 1fr, the fade runs shorter so it leads.
	   Shut, -0.375rem cancels the well's gap-1.5, so a closed fold leaves no gap behind. */
	.kanban-fold {
		display: grid;
		grid-template-rows: 0fr;
		margin-top: -0.375rem;
		opacity: 0;
		transition:
			grid-template-rows var(--duration-fast) var(--ease-smooth-out),
			margin-top var(--duration-fast) var(--ease-smooth-out),
			opacity var(--duration-quick) var(--ease-smooth-out);
	}

	.kanban-fold[data-open="true"] {
		grid-template-rows: 1fr;
		margin-top: 0;
		opacity: 1;
	}

	/* clip, not hidden: the margin lets a lifted card's shadow out while the fold stays shut. */
	.kanban-fold-inner {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		min-height: 0;
		overflow: clip;
		overflow-clip-margin: 0.375rem;
	}

	.kanban-fold-chevron {
		display: inline-flex;
		transition: transform var(--duration-fast) var(--ease-smooth-out);
	}

	.kanban-fold-chevron-open {
		transform: scaleY(-1);
	}

	.kanban-rail-item-leaving {
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--duration-quick) var(--ease-smooth-out);
	}

	/* The held card's place keeps its hole, never its content. */
	.kanban-origin-slot > :global(*) {
		visibility: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-card,
		.kanban-fold,
		.kanban-fold-chevron,
		.kanban-rail-item-leaving {
			transition: none;
		}
	}
</style>
