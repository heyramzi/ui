<script lang="ts">
/*
 * A column head that sorts the table under it. Sort buttons above a table
 * never say which column they rank, and read as filter tabs.
 */

// Every sortable head shows its caret, at 40%, solid on the active column.
// Hover-only makes people hunt, and it shifts the label under the pointer.

// No padding of its own: it comes from the skin classes, so heads and cells
// stay in line when a dense table tightens both.

// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { CaretDown, CaretUp } from "phosphor-svelte";
import { cn } from "@heyramzi/utils";
import { dataThClass, dataThNumClass } from "./data-table.js";

// =========================
// TYPES
// =========================
type Props = {
	/** True when the table is currently ranked by this column. */
	active: boolean;
	/** Which way the active column runs. Ignored while inactive. */
	descending: boolean;
	/** Called on click and on Enter/Space. Toggling direction is the caller's. */
	onSort: () => void;
	/** Numbers right-align to their digits, so their caret leads the label. */
	numeric?: boolean;
	/** The long form of an abbreviated head, as the browser tooltip. */
	title?: string;
	class?: string;
	children: Snippet;
};

// =========================
// PROPS
// =========================
let {
	active,
	descending,
	onSort,
	numeric = false,
	title,
	class: className,
	children,
}: Props = $props();

// =========================
// DERIVED
// =========================
const ariaSort = $derived(active ? (descending ? "descending" : "ascending") : "none");

// =========================
// FUNCTIONS
// =========================
function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		onSort();
	}
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<th
	scope="col"
	{title}
	tabindex="0"
	aria-sort={ariaSort}
	onclick={onSort}
	onkeydown={handleKeydown}
	class={cn(
		numeric ? dataThNumClass : dataThClass,
		"cursor-pointer select-none transition-colors hover:text-foreground",
		active && "text-foreground",
		className,
	)}
>
	<span class="inline-flex items-center gap-0.5 whitespace-nowrap">
		{#if numeric}
			{@render caret()}{@render children()}
		{:else}
			{@render children()}{@render caret()}
		{/if}
	</span>
</th>

{#snippet caret()}
	{#if active && !descending}
		<CaretUp class="size-3 shrink-0" weight="bold" />
	{:else if active}
		<CaretDown class="size-3 shrink-0" weight="bold" />
	{:else}
		<CaretDown class="size-3 shrink-0 text-muted-foreground/40" />
	{/if}
{/snippet}
