<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { flip } from "svelte/animate";
	import { cubicOut } from "svelte/easing";
	import { liftDragImage } from "./kanban-drag.js";
	import { boardOrderAt } from "./board-order.js";
	import { cn } from "./lib/cn.js";
	import { createKanbanDnd } from "./use-kanban-dnd.svelte.js";
	import chevronIcon from "./icons/chevron-right.svg?raw";
	import type { KanbanColumn as KanbanColumnDef, KanbanMove, KanbanSortKey } from "./kanban-types.js";
	import type { TaskListGroupContext, TaskListRowContext } from "./task-types.js";

	type Props<T> = {
		/** The same shape as board columns, so one config feeds both views. */
		groups: KanbanColumnDef[];
		items: T[];
		getId: (item: T) => string;
		/** The group id a row belongs to. */
		getGroup: (item: T) => string;
		/** Called on drop with what to persist. Same contract as the board. */
		onMove: (id: string, move: KanbanMove) => void | Promise<void>;
		renderRow: Snippet<[T, TaskListRowContext]>;
		/** Optional sticky header row above every group, e.g. column labels. */
		head?: Snippet;
		groupHeader?: Snippet<[KanbanColumnDef, TaskListGroupContext]>;
		boardOrder?: (item: T) => string | null | undefined;
		sortKeys?: KanbanSortKey<T>[];
		sortKey?: string;
		/** Groups can be folded from their header. Defaults to true. */
		collapsible?: boolean;
		/** Group ids that start folded. */
		collapsed?: string[];
		emptyLabel?: string;
		isDroppable?: (groupId: string) => boolean;
		class?: string;
	};

	let {
		groups,
		items,
		getId,
		getGroup,
		onMove,
		renderRow,
		head,
		groupHeader,
		boardOrder,
		sortKeys = [],
		sortKey = "manual",
		collapsible = true,
		collapsed = [],
		emptyLabel = "Nothing here yet",
		isDroppable,
		class: className,
	}: Props<T> = $props();

	// Rows past this index enter together, so a long list never waits on its stagger.
	const STAGGER_CAP = 8;

	// svelte-ignore state_referenced_locally
	let folded = $state(new Set(collapsed));

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

	function sortedByGroup(groupId: string): T[] {
		return items.filter((item) => getGroup(item) === groupId).sort(compare);
	}

	function canDrop(groupId: string): boolean {
		return isDroppable?.(groupId) ?? (groups.find((g) => g.id === groupId)?.droppable ?? true);
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

	function toggle(groupId: string): void {
		const next = new Set(folded);
		if (next.has(groupId)) next.delete(groupId);
		else next.add(groupId);
		folded = next;
	}

	/** Alt + ArrowUp/Down sends the focused row to the end of the group above or below. */
	function onRowKeyDown(e: KeyboardEvent, id: string): void {
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
			if (sortKey === "manual" && boardOrder) {
				const rows = sortedByGroup(target.id).filter((entry) => getId(entry) !== id);
				void onMove(id, {
					columnId: target.id,
					boardOrder: boardOrderAt(rows, rows.length, (entry) => boardOrder(entry)),
				});
			} else {
				void onMove(id, { columnId: target.id });
			}
			return;
		}
	}

	let view = $derived(groups.map((group) => ({ group, rows: sortedByGroup(group.id) })));
</script>

<div
	class={cn(
		"task-list flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-border bg-card text-card-foreground",
		className,
	)}
>
	{#if head}
		<div
			class="sticky top-0 z-20 flex h-9 shrink-0 items-center border-b border-border bg-card/90 text-xs font-medium text-muted-foreground backdrop-blur-sm"
		>
			{@render head()}
		</div>
	{/if}

	{#each view as { group, rows } (group.id)}
		{@const active = dnd.dragOver?.columnId === group.id}
		{@const open = !folded.has(group.id)}
		{@const hue = group.hue ?? "var(--color-primary)"}
		<section
			aria-label={group.ariaLabel ?? group.label}
			class="tl-group border-b border-border last:border-b-0"
			class:tl-group-active={active}
			style:--tl-hue={hue}
			ondragover={(e) => dnd.onColumnDragOver(e, group.id)}
			ondragleave={dnd.onDragLeave}
			ondrop={(e) => dnd.onDrop(e, group.id)}
		>
			<div class={cn("sticky z-10 flex h-10 items-center gap-2 bg-card/90 px-3 backdrop-blur-sm", head ? "top-9" : "top-0")}>
				{#if collapsible}
					<button
						type="button"
						aria-expanded={open}
						aria-label="{open ? 'Fold' : 'Unfold'} {group.label}"
						onclick={() => toggle(group.id)}
						class="-ml-1 grid size-6 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-[var(--duration-quick,150ms)] hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
					>
						<span class="tl-chevron size-3.5 [&>svg]:size-full" class:tl-chevron-open={open} aria-hidden="true">
							{@html chevronIcon}
						</span>
					</button>
				{/if}
				{#if groupHeader}
					{@render groupHeader(group, { count: rows.length, active, open })}
				{:else}
					<span class="size-2 shrink-0 rounded-full" style:background={hue}></span>
					<span class="truncate text-sm font-medium text-foreground">{group.label}</span>
					<span
						class="grid h-5 min-w-5 place-items-center rounded-sm bg-foreground/5 px-1 text-xs font-medium text-muted-foreground tabular-nums"
					>
						{rows.length}
					</span>
				{/if}
			</div>

			<div class="tl-fold" class:tl-fold-open={open}>
				<div class="tl-fold-inner">
					<div role="list" aria-label={group.label} class="flex flex-col pb-1.5">
						{#each rows as item, index (getId(item))}
							{@const id = getId(item)}
							{@const dropBefore =
								dnd.showIndicatorBefore(group.id, id) &&
								!dnd.isDragSource(id) &&
								idAt(rows, index - 1) !== dnd.draggedId}
							<div
								role="listitem"
								tabindex="0"
								aria-label="Row. Press Alt plus Up or Down arrow to move between groups."
								draggable="true"
								animate:flip={{ duration: 250, easing: cubicOut }}
								ondragstart={(e) => {
									liftDragImage(e, -1);
									dnd.onDragStart(e, id);
								}}
								ondragend={() => dnd.resetDrag()}
								ondragover={(e) => dnd.onItemDragOver(e, group.id, id, idAt(rows, index + 1))}
								onkeydown={(e) => onRowKeyDown(e, id)}
								style:--tl-i={Math.min(index, STAGGER_CAP)}
								class={cn(
									"tl-row relative mx-1.5 cursor-grab rounded-lg outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring/60",
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

						{#if rows.length === 0 && !active}
							<p class="mx-1.5 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
								{emptyLabel}
							</p>
						{/if}
					</div>
				</div>
			</div>
		</section>
	{/each}
</div>

<style>
	.tl-group {
		transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.tl-group-active {
		background: color-mix(in oklab, var(--tl-hue) 6%, transparent);
	}

	.tl-chevron {
		transition: rotate var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
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
			grid-template-rows var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			opacity var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
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
		animation: tl-row-in var(--duration-slow, 400ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)) backwards;
		animation-delay: calc(var(--tl-i, 0) * var(--duration-stagger, 40ms));
		transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
	}

	.tl-row:hover {
		background: color-mix(in oklab, var(--color-foreground, currentColor) 4%, transparent);
	}

	/* The drop line: a hairline in the group's hue with a dot where it starts. */
	.tl-drop-before::before,
	.tl-drop-end::before {
		content: "";
		position: absolute;
		left: 0.5rem;
		right: 0.5rem;
		height: 2px;
		border-radius: 1px;
		background: var(--tl-hue);
		animation: tl-line-in var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) both;
	}

	/* A ring where the line starts, so the drop point reads at a glance. */
	.tl-drop-before::after,
	.tl-drop-end::after {
		content: "";
		position: absolute;
		left: 0.25rem;
		width: 8px;
		height: 8px;
		border-radius: 999px;
		border: 2px solid var(--tl-hue);
		background: var(--color-card, white);
		animation: tl-line-in var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out) both;
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

	@keyframes tl-row-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-micro, 4px));
			filter: blur(var(--blur-small, 2px));
		}
	}

	@keyframes tl-line-in {
		from {
			opacity: 0;
			transform: scaleX(0.6);
		}
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
</style>
