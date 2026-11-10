<script lang="ts">
	import { CaretLeft, CaretRight } from "phosphor-svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import { totalPages as calcTotalPages } from "#src/components/data-table/data-table.js";

	// ========================= TYPES
	interface Props {
		page: number;
		pageSize: number;
		total: number;
		onPageChange?: (page: number) => void;
		/** If provided, renders <a> tags instead of buttons (for server-side pagination) */
		buildHref?: (page: number) => string;
		/** The accessible name of the icon-only previous and next buttons. */
		previousLabel?: string;
		nextLabel?: string;
	}

	// ========================= PROPS
	let {
		page,
		pageSize,
		total,
		onPageChange,
		buildHref,
		previousLabel = "Previous page",
		nextLabel = "Next page",
	}: Props = $props();

	// ========================= DERIVED
	let pages = $derived(calcTotalPages(total, pageSize));
	let hasPrev = $derived(page > 1);
	let hasNext = $derived(page < pages);
	let start = $derived((page - 1) * pageSize + 1);
	let end = $derived(Math.min(page * pageSize, total));
</script>

{#if pages > 1}
	<div class="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
		<span class="tabular-nums"
			>{start.toLocaleString()}-{end.toLocaleString()} of {total.toLocaleString()}</span
		>
		<div class="flex items-center gap-1">
			{#if buildHref}
				{#if hasPrev}
					<Button
						variant="outline"
						size="sm"
						icon
						href={buildHref(page - 1)}
						aria-label={previousLabel}
					>
						<CaretLeft class="size-4" aria-hidden="true" />
					</Button>
				{:else}
					<Button variant="outline" size="sm" icon disabled aria-label={previousLabel}>
						<CaretLeft class="size-4" aria-hidden="true" />
					</Button>
				{/if}
				<span class="mx-2 tabular-nums">{page.toLocaleString()} / {pages.toLocaleString()}</span>
				{#if hasNext}
					<Button
						variant="outline"
						size="sm"
						icon
						href={buildHref(page + 1)}
						aria-label={nextLabel}
					>
						<CaretRight class="size-4" aria-hidden="true" />
					</Button>
				{:else}
					<Button variant="outline" size="sm" icon disabled aria-label={nextLabel}>
						<CaretRight class="size-4" aria-hidden="true" />
					</Button>
				{/if}
			{:else}
				<Button
					variant="outline"
					size="sm"
					icon
					disabled={!hasPrev}
					aria-label={previousLabel}
					onclick={() => onPageChange?.(page - 1)}
				>
					<CaretLeft class="size-4" aria-hidden="true" />
				</Button>
				<span class="mx-2 tabular-nums">{page.toLocaleString()} / {pages.toLocaleString()}</span>
				<Button
					variant="outline"
					size="sm"
					icon
					disabled={!hasNext}
					aria-label={nextLabel}
					onclick={() => onPageChange?.(page + 1)}
				>
					<CaretRight class="size-4" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>
{/if}
