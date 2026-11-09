<script lang="ts" generics="T">
	/*
	 * The one sortable column head, for TableView, the dashboard DataTable and hand-built
	 * tables. Every sortable head shows its caret: hover-only makes people hunt.
	 */

	// ========================= IMPORTS
	import type { Snippet } from "svelte";
	import { CaretDown, CaretUp, CaretUpDown } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import type { SortDirection, SortState } from "#src/components/data-table/data-table.js";

	// ========================= TYPES
	interface Props {
		key: keyof T & string;
		sort: SortState<T>;
		/** Called on click and on Enter/Space. Choosing the next direction is the caller's. */
		onSort: (key: keyof T & string) => void;
		/** Numbers right-align to their digits, so their caret leads the label. */
		numeric?: boolean;
		/** The long form of an abbreviated head, as the browser tooltip. */
		title?: string;
		class?: string;
		style?: string;
		children: Snippet;
	}

	// ========================= PROPS
	let {
		key,
		sort,
		onSort,
		numeric = false,
		title,
		class: className,
		style,
		children,
	}: Props = $props();

	// ========================= DERIVED
	let direction = $derived<SortDirection | null>(sort?.key === key ? sort.direction : null);
	let ariaSort = $derived<"ascending" | "descending" | "none">(
		direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none",
	);

	// ========================= FUNCTIONS
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSort(key);
		}
	}
</script>

<th
	data-slot="table-head"
	scope="col"
	{title}
	{style}
	class={cn(
		"text-muted-foreground h-8 px-2 text-left align-middle text-xs font-medium whitespace-nowrap select-none",
		"cursor-pointer transition-colors duration-quick ease-smooth-out hover:bg-foreground/4 motion-reduce:transition-none",
		"outline-none focus-visible:shadow-(--ring-focus-inset)",
		numeric && "text-right",
		className,
	)}
	tabindex="0"
	aria-sort={ariaSort}
	onclick={() => onSort(key)}
	onkeydown={handleKeydown}
>
	<!-- Pinned to the line's top, not its baseline: a leading caret gave the span the icon's foot
	     as its baseline and lifted a numeric label 1.5px above the plain heads beside it. -->
	<span class="inline-flex items-center gap-1 align-top">
		{#if numeric}
			{@render caret()}{@render children()}
		{:else}
			{@render children()}{@render caret()}
		{/if}
	</span>
</th>

{#snippet caret()}
	{#if direction === "asc"}
		<CaretUp class="size-3.5 shrink-0 text-foreground" weight="bold" aria-hidden="true" />
	{:else if direction === "desc"}
		<CaretDown class="size-3.5 shrink-0 text-foreground" weight="bold" aria-hidden="true" />
	{:else}
		<CaretUpDown class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
	{/if}
{/snippet}
