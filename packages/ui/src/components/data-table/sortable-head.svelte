<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { CaretDown, CaretUp, CaretUpDown } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import type { SortDirection, SortState } from "#src/components/data-table/data-table.js";

	// ========================= TYPES
	interface Props {
		key: keyof T & string;
		sort: SortState<T>;
		onSort: (key: keyof T & string) => void;
		class?: string;
		children: Snippet;
	}

	// ========================= PROPS
	let { key, sort, onSort, class: className, children }: Props = $props();

	// ========================= DERIVED
	let active = $derived(sort?.key === key);
	let direction = $derived<SortDirection | null>(sort && active ? sort.direction : null);
	let ariaSort = $derived<"ascending" | "descending" | "none">(
		direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none",
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSort(key);
		}
	}
</script>

<th
	data-slot="table-head"
	class={cn(
		"text-muted-foreground h-8 px-2 text-left align-middle text-xs font-medium whitespace-nowrap select-none",
		"cursor-pointer hover:bg-muted/30 transition-colors",
		className,
	)}
	tabindex="0"
	aria-sort={ariaSort}
	onclick={() => onSort(key)}
	onkeydown={handleKeydown}
>
	<span class="inline-flex items-center gap-1">
		{@render children()}
		{#if direction === "asc"}
			<CaretUp class="size-3.5 text-foreground" weight="bold" />
		{:else if direction === "desc"}
			<CaretDown class="size-3.5 text-foreground" weight="bold" />
		{:else}
			<CaretUpDown class="size-3.5 text-muted-foreground/75" />
		{/if}
	</span>
</th>
