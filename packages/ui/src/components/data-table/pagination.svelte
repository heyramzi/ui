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
};

// ========================= PROPS
let { page, pageSize, total, onPageChange, buildHref }: Props = $props();

// ========================= DERIVED
let pages = $derived(calcTotalPages(total, pageSize));
let hasPrev = $derived(page > 1);
let hasNext = $derived(page < pages);
let start = $derived((page - 1) * pageSize + 1);
let end = $derived(Math.min(page * pageSize, total));
</script>

{#if pages > 1}
	<div class="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
		<span>{start}-{end} of {total}</span>
		<div class="flex items-center gap-1">
			{#if buildHref}
				{#if hasPrev}
					<Button variant="outline" size="sm" icon href={buildHref(page - 1)}>
						<CaretLeft class="size-4" />
					</Button>
				{:else}
					<Button variant="outline" size="sm" icon disabled>
						<CaretLeft class="size-4" />
					</Button>
				{/if}
				<span class="mx-2 tabular-nums">{page} / {pages}</span>
				{#if hasNext}
					<Button variant="outline" size="sm" icon href={buildHref(page + 1)}>
						<CaretRight class="size-4" />
					</Button>
				{:else}
					<Button variant="outline" size="sm" icon disabled>
						<CaretRight class="size-4" />
					</Button>
				{/if}
			{:else}
				<Button variant="outline" size="sm" icon disabled={!hasPrev} onclick={() => onPageChange?.(page - 1)}>
					<CaretLeft class="size-4" />
				</Button>
				<span class="mx-2 tabular-nums">{page} / {pages}</span>
				<Button variant="outline" size="sm" icon disabled={!hasNext} onclick={() => onPageChange?.(page + 1)}>
					<CaretRight class="size-4" />
				</Button>
			{/if}
		</div>
	</div>
{/if}
