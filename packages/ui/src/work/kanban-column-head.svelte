<script lang="ts" generics="C extends KanbanColumnDef">
	import type { Snippet } from "svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import GroupHead from "#src/components/work-parts/group-head.svelte";
	import KanbanFoldChevron from "#src/work/kanban-fold-chevron.svelte";
	import type {
		KanbanColumn as KanbanColumnDef,
		KanbanColumnContext,
	} from "#src/work/kanban-types.js";

	interface Props {
		column: C;
		context: KanbanColumnContext;
		/** The board's `columnHeader`. Left out, the head is GroupHead. */
		columnHeader?: Snippet<[C, KanbanColumnContext]>;
		onAdd?: (columnId: string) => void;
		addLabel: string;
		/** The column holds more cards than its cap, so the caret shows. */
		foldable: boolean;
		/** The caret has the column open in every lane. */
		columnOpen: boolean;
		onToggle: () => void;
		expandColumnLabel: string;
		collapseColumnLabel: string;
	}

	let {
		column,
		context,
		columnHeader,
		onAdd,
		addLabel,
		foldable,
		columnOpen,
		onToggle,
		expandColumnLabel,
		collapseColumnLabel,
	}: Props = $props();
</script>

{#if columnHeader}
	{@render columnHeader(column, context)}
{:else}
	<GroupHead
		label={column.label}
		hue={column.hue}
		count={context.count}
		onAdd={onAdd ? () => onAdd(column.id) : undefined}
		{addLabel}
	/>
{/if}
{#if foldable}
	<!-- Opens the column in every lane; "Show N more" opens one. Hiding into the rail stays the header's own button. -->
	<Button
		variant="ghost"
		size="sm"
		icon
		aria-expanded={columnOpen}
		aria-label="{columnOpen ? collapseColumnLabel : expandColumnLabel} {column.label}"
		onclick={onToggle}
		class="-me-1 ms-auto size-6 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity duration-(--duration-quick) hover:text-foreground focus-visible:opacity-100 [.kanban-column:hover_&]:opacity-100 [@media(hover:none)]:opacity-100"
	>
		<KanbanFoldChevron open={columnOpen} class="size-3" />
	</Button>
{/if}
