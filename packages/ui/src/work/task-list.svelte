<script lang="ts" generics="T, C extends KanbanColumnDef = KanbanColumnDef">
	import type { Snippet } from "svelte";
	import LiveRegion from "#src/lib/live-region.svelte";
	import { focusAfterRender } from "#src/lib/focus.js";
	import { flip } from "svelte/animate";
	import { cubicOut } from "svelte/easing";
	import { durationMs } from "#src/lib/motion.js";
	import { liftDragImage } from "#src/work/kanban-drag.js";
	import { boardOrderAt } from "#src/work/board-order.js";
	import { cn } from "#src/lib/utils.js";
	import { createKanbanDnd } from "#src/work/use-kanban-dnd.svelte.js";
	import { CaretRight } from "phosphor-svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import * as Collapsible from "#src/shadcn/collapsible/index.js";
	import GroupHead from "#src/components/work-parts/group-head.svelte";
	import { workLooks } from "#src/components/work-parts/looks.js";
	import type {
		KanbanColumn as KanbanColumnDef,
		KanbanMove,
		KanbanSortKey,
	} from "#src/work/kanban-types.js";
	import type { TaskListGroupContext, TaskListRowContext } from "#src/work/task-types.js";

	interface Props<T, C extends KanbanColumnDef> {
		/** The same shape as board columns, so one config feeds both views. */
		groups: C[];
		items: T[];
		getId: (item: T) => string;
		/** The group id a row belongs to. */
		getGroup: (item: T) => string;
		/**
		 * Nests a group under another by its id, e.g. a project under its client, so it folds with
		 * its parent. Return nothing for a top-level group.
		 */
		getParent?: (group: C) => string | null | undefined;
		/** Called on drop with what to persist. Same contract as the board. */
		onMove: (id: string, move: KanbanMove) => void | Promise<void>;
		renderRow: Snippet<[T, TaskListRowContext]>;
		/** Optional sticky header row above every group, e.g. column labels. */
		head?: Snippet;
		groupHeader?: Snippet<[C, TaskListGroupContext]>;
		/** Controls at the end of a group header, shown on hover, focus or a coarse pointer. */
		actions?: Snippet<[C, TaskListGroupContext]>;
		/** Rendered under a group's rows, e.g. an add-task row. Folds with the group. */
		groupFooter?: Snippet<[C, TaskListGroupContext]>;
		boardOrder?: (item: T) => string | null | undefined;
		/** Breaks a tie in manual order: two rows with the same key, or both without one. */
		manualTiebreak?: (a: T, b: T) => number;
		/**
		 * Rows drag and take Alt plus Up or Down. Turn it off for a list that only groups, where
		 * rows hold their own links and buttons.
		 */
		draggable?: boolean;
		/** The screen-reader name of a row. Defaults to the row's own text. */
		getLabel?: (item: T) => string;
		/** Read after a draggable row's name, as its description. */
		moveHint?: string;
		/** What a screen reader hears after a row moves with the keyboard. */
		movedLabel?: (group: C) => string;
		/** Fires when a group is folded or unfolded, with every folded id. */
		onCollapsedChange?: (ids: string[]) => void;
		sortKeys?: KanbanSortKey<T>[];
		sortKey?: string;
		/** Groups can be folded from their header. Defaults to true. */
		collapsible?: boolean;
		/** Group ids that start folded. */
		collapsed?: string[];
		emptyLabel?: string;
		/** Shows a plus in each default group head that adds a row to that group. */
		onAdd?: (groupId: string) => void;
		/** The plus button's accessible name, followed by the group label. */
		addLabel?: string;
		isDroppable?: (groupId: string) => boolean;
		/** Drops the card chrome (border, radius, fill) so the list sits flat on the page. Group dividers stay. */
		flat?: boolean;
		class?: string;
	}

	let {
		groups,
		items,
		getId,
		getGroup,
		getParent,
		onMove,
		renderRow,
		head,
		groupHeader,
		actions,
		groupFooter,
		boardOrder,
		manualTiebreak,
		draggable = true,
		getLabel,
		moveHint = "Press Alt plus Up or Down arrow to move between groups.",
		movedLabel = (group) => `Moved to ${group.label}`,
		onCollapsedChange,
		sortKeys = [],
		sortKey = "manual",
		collapsible = true,
		collapsed = [],
		emptyLabel = "Nothing here yet",
		onAdd,
		addLabel = "Add a task",
		isDroppable,
		flat = false,
		class: className,
	}: Props<T, C> = $props();

	// Rows past this index enter together, so a long list never waits on its stagger.
	const STAGGER_CAP = 8;

	// svelte-ignore state_referenced_locally
	let folded = $state(new Set(collapsed));
	const uid = $props.id();
	const hintId = `${uid}-hint`;
	let listEl: HTMLDivElement | undefined = $state();
	let live: LiveRegion | undefined = $state();

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

	function sortedByGroup(groupId: string): T[] {
		return items.filter((item) => getGroup(item) === groupId).sort(compare);
	}

	// A group nested under a missing parent is top-level, so no row is ever dropped from view.
	let groupIds = $derived(new Set(groups.map((g) => g.id)));
	let roots = $derived(
		groups.filter((g) => {
			const parent = getParent?.(g);
			return !parent || !groupIds.has(parent);
		}),
	);
	let childrenOf = $derived.by(() => {
		const map = new Map<string, C[]>();
		for (const g of groups) {
			const parent = getParent?.(g);
			if (!parent || !groupIds.has(parent)) continue;
			map.set(parent, [...(map.get(parent) ?? []), g]);
		}
		return map;
	});

	/** Rows in a group and in every group nested under it. */
	function countWithin(groupId: string): number {
		let n = sortedByGroup(groupId).length;
		for (const child of childrenOf.get(groupId) ?? []) n += countWithin(child.id);
		return n;
	}

	function canDrop(groupId: string): boolean {
		// A group that only holds other groups has no rows of its own to drop into.
		if (childrenOf.has(groupId)) return false;
		return isDroppable?.(groupId) ?? groups.find((g) => g.id === groupId)?.droppable ?? true;
	}

	function idAt(list: T[], index: number): string | null {
		const item = list[index];
		return item === undefined ? null : getId(item);
	}

	const dnd = createKanbanDnd<T>({
		items: () => items,
		getId: (item) => getId(item),
		getColumn: (item) => getGroup(item),
		getColumnItems: sortedByGroup,
		getSortKey: () => sortKey,
		boardOrder: (item) => boardOrder?.(item),
		onMove: (id, move) => onMove(id, move),
		isDroppable: canDrop,
	});

	function setOpen(groupId: string, open: boolean): void {
		if (open !== folded.has(groupId)) return;
		const next = new Set(folded);
		if (open) next.delete(groupId);
		else next.add(groupId);
		folded = next;
		onCollapsedChange?.([...next]);
	}

	/** Unfolds a group and every group it sits in, so a row moved there can take focus. */
	function reveal(groupId: string): void {
		const next = new Set(folded);
		const seen = new Set<string>();
		let group = groups.find((g) => g.id === groupId);
		while (group && !seen.has(group.id)) {
			seen.add(group.id);
			next.delete(group.id);
			const parent = getParent?.(group);
			group = parent ? groups.find((g) => g.id === parent) : undefined;
		}
		if (next.size === folded.size) return;
		folded = next;
		onCollapsedChange?.([...next]);
	}

	/** Alt + ArrowUp/Down sends the focused row to the end of the group above or below. */
	async function onRowKeyDown(e: KeyboardEvent, id: string): Promise<void> {
		const target = moveRow(e, id);
		if (!target) return;
		await target.done;
		reveal(target.group.id);
		void live?.announce(movedLabel(target.group));
		await focusAfterRender(listEl, `[data-task-row="${CSS.escape(id)}"]`);
	}

	function moveRow(
		e: KeyboardEvent,
		id: string,
	): { group: C; done: void | Promise<void> } | undefined {
		if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
		const item = items.find((entry) => getId(entry) === id);
		if (!item) return;
		const current = getGroup(item);
		const at = groups.findIndex((g) => g.id === current);
		if (at === -1) return;
		const dir = e.key === "ArrowDown" ? 1 : -1;
		for (let i = at + dir; i >= 0 && i < groups.length; i += dir) {
			const target = groups[i];
			if (!canDrop(target.id)) continue;
			e.preventDefault();
			if (sortKey !== "manual") return { group: target, done: onMove(id, { columnId: target.id }) };
			const rows = sortedByGroup(target.id).filter((entry) => getId(entry) !== id);
			const last = rows.at(-1);
			const done = onMove(id, {
				columnId: target.id,
				...(boardOrder
					? { boardOrder: boardOrderAt(rows, rows.length, (entry) => boardOrder(entry)) }
					: {}),
				beforeId: last === undefined ? null : getId(last),
				afterId: null,
			});
			return { group: target, done };
		}
	}
</script>

{#snippet section(group: C, depth: number)}
	{@const rows = sortedByGroup(group.id)}
	{@const children = childrenOf.get(group.id) ?? []}
	{@const count = countWithin(group.id)}
	{@const active = dnd.dragOver?.columnId === group.id}
	{@const open = !folded.has(group.id)}
	{@const hue = group.hue ?? "var(--color-primary)"}
	{@const context = { count, active, open, depth, hasChildren: children.length > 0 }}
	<Collapsible.Root bind:open={() => open, (next) => setOpen(group.id, next)}>
		{#snippet child({ props })}
			<section
				{...props}
				aria-label={group.ariaLabel ?? group.label}
				class={cn(
					"tl-group group/tl",
					depth === 0 ? "border-b border-border last:border-b-0" : "border-t border-border/60",
				)}
				class:tl-group-active={active}
				style:--tl-hue={hue}
				ondragover={children.length ? undefined : (e) => dnd.onColumnDragOver(e, group.id)}
				ondragleave={children.length ? undefined : dnd.onDragLeave}
				ondrop={children.length ? undefined : (e) => dnd.onDrop(e, group.id)}
			>
				<div
					class={cn(
						"hover-row sticky z-10 flex h-10 items-center gap-2 px-3 backdrop-blur-sm",
						flat ? "bg-card/90" : "bg-card/90",
						depth === 0 && (head ? "top-9" : "top-0"),
					)}
					style:top={depth > 0 ? `${(head ? 2.25 : 0) + depth * 2.5}rem` : undefined}
					style:padding-inline-start={depth > 0 ? `${0.75 + depth * 1.25}rem` : undefined}
				>
					{#if collapsible}
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="sm"
									icon
									aria-label="{open ? 'Fold' : 'Unfold'} {group.label}"
									class="-ml-1.5 text-muted-foreground"
								>
									<span
										class="tl-chevron size-3.5 [&>svg]:size-full"
										class:tl-chevron-open={open}
										aria-hidden="true"
									>
										<CaretRight aria-hidden="true" weight="bold" />
									</span>
								</Button>
							{/snippet}
						</Collapsible.Trigger>
					{/if}
					{#if groupHeader}
						{@render groupHeader(group, context)}
					{:else}
						<GroupHead
							label={group.label}
							{hue}
							{count}
							onAdd={onAdd ? () => onAdd(group.id) : undefined}
							{addLabel}
						/>
					{/if}
					{#if actions}
						<div class="tl-actions row-action ms-auto flex shrink-0 items-center gap-1">
							{@render actions(group, context)}
						</div>
					{/if}
				</div>

				<!-- inert: a folded group's rows leave the Tab order and the accessibility tree. -->
				<Collapsible.Content forceMount>
					{#snippet child({ props })}
						<div {...props} class="tl-fold" class:tl-fold-open={open} inert={!open}>
							<div class="tl-fold-inner">
								<div role="list" aria-label={group.label} class="flex flex-col pb-1.5">
									{#each rows as item, index (getId(item))}
										{@const id = getId(item)}
										{@const rowId = `${uid}-row-${encodeURIComponent(id)}`}
										{@const dropBefore =
											dnd.showIndicatorBefore(group.id, id) &&
											!dnd.isDragSource(id) &&
											idAt(rows, index - 1) !== dnd.draggedId}
										<!-- WHY: a row is a list item that takes focus for the Alt+arrow move; making it a button would hide the list from screen readers. -->
										<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
										<div
											role="listitem"
											tabindex={draggable ? 0 : undefined}
											id={rowId}
											data-task-row={id}
											aria-label={getLabel?.(item)}
											aria-labelledby={draggable && !getLabel ? rowId : undefined}
											aria-describedby={draggable ? hintId : undefined}
											aria-keyshortcuts={draggable ? "Alt+ArrowUp Alt+ArrowDown" : undefined}
											draggable={draggable ? "true" : undefined}
											animate:flip={{ duration: () => durationMs("fast"), easing: cubicOut }}
											ondragstart={draggable
												? (e) => {
														liftDragImage(e);
														dnd.onDragStart(e, id);
													}
												: undefined}
											ondragend={draggable ? () => dnd.resetDrag() : undefined}
											ondragover={draggable
												? (e) => dnd.onItemDragOver(e, group.id, id, idAt(rows, index + 1))
												: undefined}
											onkeydown={draggable ? (e) => void onRowKeyDown(e, id) : undefined}
											style:--tl-i={Math.min(index, STAGGER_CAP)}
											class={cn(
												"tl-row relative mx-1.5 outline-none focus-visible:shadow-(--ring-focus)",
												workLooks.row,
												workLooks.rowHeight,
												draggable && "cursor-grab active:cursor-grabbing",
												dropBefore && "tl-drop-before",
												dnd.isDragSource(id) && "opacity-40",
											)}
										>
											{@render renderRow(item, { groupId: group.id, index })}
										</div>
									{/each}

									{#if dnd.showIndicatorEnd(group.id) && idAt(rows, rows.length - 1) !== dnd.draggedId}
										<div class="tl-drop-end relative mx-1.5 h-2" aria-hidden="true"></div>
									{/if}

									{#if groupFooter}
										{@render groupFooter(group, context)}
									{/if}

									{#if rows.length === 0 && children.length === 0 && !active}
										<p
											class={cn(
												workLooks.rowHole,
												"mx-1.5 px-3 py-3 text-xs text-muted-foreground",
											)}
										>
											{emptyLabel}
										</p>
									{/if}
								</div>

								{#each children as sub (sub.id)}
									{@render section(sub, depth + 1)}
								{/each}
							</div>
						</div>
					{/snippet}
				</Collapsible.Content>
			</section>
		{/snippet}
	</Collapsible.Root>
{/snippet}

<div
	bind:this={listEl}
	class={cn(
		"task-list flex min-h-0 flex-1 flex-col overflow-y-auto",
		flat ? "bg-card" : workLooks.panel,
		className,
	)}
>
	{#if head}
		<div
			class={cn(
				"sticky top-0 z-20 flex h-9 shrink-0 items-center border-b border-border text-xs font-medium text-muted-foreground backdrop-blur-sm",
				flat ? "bg-card/90" : "bg-card/90",
			)}
		>
			{@render head()}
		</div>
	{/if}

	{#each roots as group (group.id)}
		{@render section(group, 0)}
	{/each}

	<LiveRegion bind:this={live} />
	{#if draggable}
		<p id={hintId} hidden>{moveHint}</p>
	{/if}
</div>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		.tl-group {
			transition: background-color var(--duration-quick) var(--ease-smooth-out);
		}

		.tl-group-active {
			background: color-mix(in oklab, var(--tl-hue) 6%, transparent);
		}

		.tl-chevron {
			transition: rotate var(--duration-fast) var(--ease-smooth-out);
		}

		.tl-chevron-open {
			rotate: 90deg;
		}

		/* A 0fr to 1fr track folds to any height. Padding lives inside, or 0fr never fully closes. */
		.tl-fold {
			display: grid;
			grid-template-rows: 0fr;
			opacity: 0;
			transition:
				grid-template-rows var(--duration-fast) var(--ease-smooth-out),
				opacity var(--duration-quick) var(--ease-smooth-out);
		}

		.tl-fold-open {
			grid-template-rows: 1fr;
			opacity: 1;
		}

		.tl-fold-inner {
			min-height: 0;
			overflow: hidden;
		}

		.tl-row {
			animation: tl-row-in var(--duration-slow) var(--ease-smooth-out) backwards;
			animation-delay: calc(var(--tl-i, 0) * var(--duration-stagger));
			transition: background-color var(--duration-quick) var(--ease-smooth-out);
		}

		@media (hover: hover) and (pointer: fine) {
			.tl-row:hover {
				background: color-mix(in oklab, var(--color-foreground) 4%, transparent);
			}
		}

		/* The drop line: a hairline in the group's hue with a dot where it starts. */
		.tl-drop-before::before,
		.tl-drop-end::before {
			content: "";
			position: absolute;
			left: 0.5rem;
			right: 0.5rem;
			height: 2px;
			background: var(--tl-hue);
			animation: tl-line-in var(--duration-quick) var(--ease-smooth-out) both;
		}

		/* A ring where the line starts, so the drop point reads at a glance. */
		.tl-drop-before::after,
		.tl-drop-end::after {
			content: "";
			position: absolute;
			left: 0.25rem;
			width: 8px;
			height: 8px;
			/* A ring drawn as a gradient, so the line needs no radius or border of its own. */
			background: radial-gradient(
				circle closest-side,
				var(--color-card) calc(50% - 0.5px),
				var(--tl-hue) 50%,
				var(--tl-hue) calc(100% - 0.5px),
				transparent 100%
			);
			animation: tl-line-in var(--duration-quick) var(--ease-smooth-out) both;
		}

		.tl-drop-before::before {
			top: -1px;
		}

		.tl-drop-before::after {
			top: -4px;
		}

		.tl-drop-end::before {
			top: 0;
		}

		.tl-drop-end::after {
			top: -3px;
		}

		@media (prefers-reduced-motion: reduce) {
			.tl-row,
			.tl-drop-before::before,
			.tl-drop-end::before,
			.tl-drop-before::after,
			.tl-drop-end::after {
				animation: none;
			}
			.tl-fold,
			.tl-chevron {
				transition: none;
			}
		}
	}

	@keyframes tl-row-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-micro));
			filter: blur(var(--blur-small));
		}
	}

	@keyframes tl-line-in {
		from {
			opacity: 0;
			transform: scaleX(0.6);
		}
	}
</style>
