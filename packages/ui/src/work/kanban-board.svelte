<script lang="ts" generics="T, C extends KanbanColumnDef = KanbanColumnDef">
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import KanbanColumn from "#src/work/kanban-column.svelte";
	import KanbanColumnHead from "#src/work/kanban-column-head.svelte";
	import KanbanFoldChevron from "#src/work/kanban-fold-chevron.svelte";
	import KanbanHiddenRail from "#src/work/kanban-hidden-rail.svelte";
	import { liftDragImage } from "#src/work/kanban-drag.js";
	import { cn } from "#src/lib/utils.js";
	import {
		createKanbanBoardState,
		type KanbanColumnView,
	} from "#src/work/kanban-board-state.svelte.js";
	import { Button } from "#src/shadcn/button/index.js";
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

	const board = createKanbanBoardState<T, C>(() => ({
		columns,
		items,
		getId,
		getColumn,
		onMove,
		boardOrder,
		manualTiebreak,
		sortKeys,
		sortKey,
		onSelect,
		limit,
		expanded,
		onExpandedChange,
		hidden,
		onHiddenChange,
		dropAtTop,
		isDroppable,
	}));
	const dnd = board.dnd;
	const rail = board.rail;

	type ColumnView = KanbanColumnView<T, C>;
</script>

<!-- The slot keeps the drag state where it is, or hovering it would bubble to the column and jump it to the end. -->
{#snippet dropSlot()}
	<div
		class={cn("kanban-drop-slot min-h-10 shrink-0", workLooks.hole)}
		aria-hidden="true"
		style:height="{board.slotHeight}px"
		transition:slide={board.slotMotion}
		ondragover={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}
	></div>
{/snippet}

{#snippet card(column: C, item: T, index: number, list: T[])}
	{@const id = getId(item)}
	{@const nextId = board.idAt(list, index + 1)}
	{@const isSource = dnd.isDragSource(id)}
	<!-- The slot right after the held card is its own spot, so the card's place shows it instead. -->
	{@const atOrigin =
		!dnd.dragOver || (dnd.dragOver.columnId === column.id && dnd.dragOver.overId === nextId)}
	{#if dnd.showIndicatorBefore(column.id, id) && !isSource && board.idAt(list, index - 1) !== dnd.draggedId}
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
			board.slotHeight = e.currentTarget.getBoundingClientRect().height;
			liftDragImage(e);
			dnd.onDragStart(e, id);
		}}
		ondragend={() => {
			dnd.resetDrag();
			rail.dragOverHidden = null;
		}}
		ondragover={(e) => dnd.onItemDragOver(e, column.id, id, nextId)}
		onkeydown={(e) => board.onCardKeyDown(e, id)}
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
	{@const context = board.contextOf(entry, active)}
	{@const showTail = tail.length > 0}
	{@const list = [...head, ...tail]}
	{@const shown = capped ? head : list}
	<KanbanColumn
		{...extra}
		hue={column.hue}
		{active}
		collapsing={rail.collapsing.has(column.id)}
		expanding={rail.expanding.has(column.id)}
		ariaLabel={column.ariaLabel ?? column.label}
		ondragover={(e) => dnd.onColumnDragOver(e, column.id)}
		ondragleave={dnd.onDragLeave}
		ondrop={(e) => dnd.onDrop(e, column.id)}
	>
		{#snippet header()}
			<KanbanColumnHead
				{column}
				{context}
				{columnHeader}
				{onAdd}
				{addLabel}
				foldable={entry.foldable}
				columnOpen={board.expandedIds.includes(column.id)}
				onToggle={() => board.toggleColumn(column.id)}
				{expandColumnLabel}
				{collapseColumnLabel}
			/>
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

		{#if dnd.showIndicatorEnd(column.id) && board.idAt(shown, shown.length - 1) !== dnd.draggedId}
			{@render dropSlot()}
		{/if}

		{#if tail.length > 0 || open}
			<Button
				variant="ghost"
				size="sm"
				aria-expanded={open}
				onclick={() => (open ? board.collapse(column.id) : board.expand(column.id))}
				class="shrink-0 justify-start gap-1.5 px-2 text-xs font-normal text-muted-foreground"
			>
				<KanbanFoldChevron {open} class="size-2.5" />
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
	{#each board.view as entry (entry.column.id)}
		{@const column = entry.column}
		{#if !rail.hiddenSet.has(column.id) || rail.collapsing.has(column.id)}
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

	{#if board.hiddenColumns.length > 0}
		<KanbanHiddenRail
			columns={board.hiddenColumns}
			{rail}
			countOf={(columnId) => board.sortedByColumn(columnId).length}
			{hiddenLabel}
			{showAllLabel}
			{hiddenItem}
		/>
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

	/* The held card's place keeps its hole, never its content. */
	.kanban-origin-slot > :global(*) {
		visibility: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-card,
		.kanban-fold {
			transition: none;
		}
	}
</style>
