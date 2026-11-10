<script lang="ts" generics="C extends KanbanColumnDef">
	import type { Snippet } from "svelte";
	import { CaretDown } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import * as Collapsible from "#src/shadcn/collapsible/index.js";
	import { workLooks } from "#src/components/work-parts/looks.js";
	import type { KanbanRailState } from "#src/work/kanban-rail-state.svelte.js";
	import type { KanbanColumn as KanbanColumnDef } from "#src/work/kanban-types.js";

	interface Props {
		/** The columns folded into the rail, in board order. */
		columns: C[];
		rail: KanbanRailState;
		/** How many cards a column holds. */
		countOf: (columnId: string) => number;
		hiddenLabel: string;
		showAllLabel: string;
		hiddenItem?: Snippet<[C, { count: number; active: boolean }]>;
	}

	let { columns, rail, countOf, hiddenLabel, showAllLabel, hiddenItem }: Props = $props();
</script>

<Collapsible.Root bind:open={rail.railOpen} class="kanban-rail flex w-40 shrink-0 flex-col gap-1">
	<Collapsible.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="sm"
				class="justify-start px-2 text-xs font-normal text-muted-foreground"
			>
				<span
					class={cn(
						"size-2.5 transition-transform duration-fast ease-smooth-out motion-reduce:transition-none [&>svg]:size-full",
						!rail.railOpen && "-rotate-90",
					)}
					aria-hidden="true"><CaretDown aria-hidden="true" weight="bold" /></span
				>
				{hiddenLabel}
			</Button>
		{/snippet}
	</Collapsible.Trigger>

	<Collapsible.Content class="flex flex-col gap-0.5">
		{#each columns as column (column.id)}
			{@const count = countOf(column.id)}
			{@const over = rail.dragOverHidden === column.id}
			{@const hue = column.hue ?? "var(--color-primary)"}
			<div
				role="region"
				aria-label={column.ariaLabel ?? column.label}
				class={cn(
					"kanban-rail-item transition-[background-color,outline-color] duration-quick ease-smooth-out",
					workLooks.row,
					rail.leaving.has(column.id) && "kanban-rail-item-leaving",
				)}
				style:background="color-mix(in oklch, {hue}
				{over ? 10 : 0}%, transparent)"
				style:outline="1px solid color-mix(in oklch, {hue}
				{over ? 28 : 0}%, transparent)"
				ondragover={(e) => rail.onHiddenDragOver(e, column.id)}
				ondragleave={rail.onHiddenDragLeave}
				ondrop={(e) => rail.onHiddenDrop(e, column.id)}
			>
				<Button
					variant="ghost"
					size="lg"
					onclick={() => rail.show(column.id)}
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

		{#if columns.length > 1}
			<Button
				variant="ghost"
				size="sm"
				onclick={rail.showAll}
				class="mt-1 justify-start text-xs font-normal text-muted-foreground"
			>
				{showAllLabel}
			</Button>
		{/if}
	</Collapsible.Content>
</Collapsible.Root>

<style>
	/* Unlayered: the row's transition-[background-color,outline-color] utility would otherwise drop the fade out. */
	.kanban-rail-item-leaving {
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--duration-quick) var(--ease-smooth-out);
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-rail-item-leaving {
			transition: none;
		}
	}
</style>
