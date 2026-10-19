<script lang="ts" module>
import type { Snippet } from "svelte";

/** One figure column. Give it `value`, `rating` or a `cell` snippet. */
export type MetricColumn<T> = {
	key: string;
	label: string;
	/** The long form of the head, as its tooltip. */
	hint?: string;
	/** A Tailwind width class. Fixed widths are what keep the lead column wide. */
	width: string;
	/** Makes the head rank the table. Higher is better; a new column starts descending. */
	sort?: (row: T) => number;
	/** Null draws the table's empty label, muted. */
	value?: (row: T) => string | null;
	rating?: (row: T) => { grade: string; hint?: string } | null;
	cell?: Snippet<[T]>;
	/** Cell tooltip. */
	title?: (row: T) => string | undefined;
	muted?: boolean | ((row: T) => boolean);
	/** The column the eye lands on first. */
	strong?: boolean;
	/** A hairline before this column, opening a group. */
	rule?: boolean;
};
</script>

<script lang="ts" generics="T">
/*
 * The ranked metrics table: wide lead cell, fixed figure columns, sortable
 * heads, optional pager. Row detail lives in its side panel.
 */
import { cn } from "@heyramzi/utils";
import DataSortHead from "./data-sort-head.svelte";
import RatingChip from "./rating-chip.svelte";
import { Pagination, paginateRows, totalPages } from "@heyramzi/ui/components/data-table";
import {
	dataTableClass,
	dataTdClass,
	dataTdNumClass,
	dataThClass,
	dataThNumClass,
	dataTheadClass,
	dataTrClass,
} from "./data-table.js";

interface Props {
	rows: T[];
	columns: MetricColumn<T>[];
	rowKey: (row: T) => string;
	leadLabel: string;
	lead: Snippet<[T]>;
	/** Drawn where a value or rating is null. */
	emptyLabel: string;
	/** A Tailwind width class. Omit and the lead takes whatever the figures leave. */
	leadWidth?: string;
	/** A Tailwind min-width class, past which the panel scrolls sideways. */
	minWidth?: string;
	/** Omit for every row on one page. */
	pageSize?: number;
	sortKey?: string | null;
	descending?: boolean;
	page?: number;
};

let {
	rows,
	columns,
	rowKey,
	leadLabel,
	lead,
	emptyLabel,
	leadWidth,
	minWidth = "min-w-[48rem]",
	pageSize,
	sortKey = $bindable(null),
	descending = $bindable(true),
	page = $bindable(1),
}: Props = $props();

const pad = "px-3";

const sorted = $derived.by(() => {
	const by = columns.find((column) => column.key === sortKey)?.sort;
	if (!by) return rows;
	const direction = descending ? -1 : 1;
	return [...rows].sort((left, right) => (by(left) - by(right)) * direction);
});

const visible = $derived(pageSize ? paginateRows(sorted, page, pageSize) : sorted);

// Fewer rows than the page you stand on would draw an empty table.
$effect(() => {
	if (!pageSize) return;
	const last = totalPages(sorted.length, pageSize);
	if (page > last) page = last;
});

function rankBy(key: string) {
	page = 1;
	if (sortKey === key) {
		descending = !descending;
		return;
	}
	sortKey = key;
	descending = true;
}

function isMuted(column: MetricColumn<T>, row: T) {
	return typeof column.muted === "function" ? column.muted(row) : Boolean(column.muted);
}
</script>

<table class={cn(dataTableClass, minWidth, "table-fixed")}>
	<colgroup>
		<col class={leadWidth} />
		{#each columns as column (column.key)}
			<col class={column.width} />
		{/each}
	</colgroup>
	<thead class={dataTheadClass}>
		<tr>
			<th scope="col" class={dataThClass}>{leadLabel}</th>
			{#each columns as column (column.key)}
				{#if column.sort}
					<DataSortHead
						numeric
						class={cn(pad, column.rule && "border-l border-border")}
						active={sortKey === column.key}
						{descending}
						onSort={() => rankBy(column.key)}
						title={column.hint}
					>
						{column.label}
					</DataSortHead>
				{:else}
					<th
						scope="col"
						class={cn(dataThNumClass, pad, column.rule && "border-l border-border")}
						title={column.hint}
					>
						{column.label}
					</th>
				{/if}
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each visible as row (rowKey(row))}
			<tr class={cn(dataTrClass, "group")}>
				<td class={cn(dataTdClass, "py-3")}>{@render lead(row)}</td>
				{#each columns as column (column.key)}
					<td
						class={cn(
							dataTdNumClass,
							pad,
							"align-middle whitespace-nowrap",
							column.strong && "font-medium",
							isMuted(column, row) && "text-muted-foreground",
							column.rule && "border-l border-border",
						)}
						title={column.title?.(row)}
					>
						{#if column.cell}
							{@render column.cell(row)}
						{:else if column.rating}
							{@const rating = column.rating(row)}
							{#if rating}
								<RatingChip grade={rating.grade} hint={rating.hint} />
							{:else}
								<span class="text-muted-foreground">{emptyLabel}</span>
							{/if}
						{:else}
							{@const value = column.value?.(row) ?? null}
							{#if value === null}
								<span class="text-muted-foreground">{emptyLabel}</span>
							{:else}
								{value}
							{/if}
						{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
{#if pageSize}
	<Pagination {page} {pageSize} total={sorted.length} onPageChange={(next) => (page = next)} />
{/if}
