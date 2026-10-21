<script lang="ts" module>
import type { Snippet } from "svelte";

/** Narrow screens drop the columns that only add detail. */
export type DataColumnBreakpoint = "sm" | "md" | "lg";

/** One column after the lead. Give it `value`, `rating` or a `cell` snippet. */
export type DataColumn<T> = {
	key: string;
	label: string;
	/** The long form of the head, as its tooltip. */
	hint?: string;
	/** A Tailwind width class. Fixed widths are what keep the lead column wide. */
	width: string;
	/** Figures run to the end, so digits line up. Text, pills and bars start. */
	align?: "start" | "end";
	/** Makes the head rank the table. Higher is better; a new column starts descending. */
	sort?: (row: T) => number;
	/** Null draws the table's empty label, muted. */
	value?: (row: T) => string | null;
	rating?: (row: T) => { grade: string; hint?: string } | null;
	cell?: Snippet<[T]>;
	/** 0 to 1, a share-of-max track drawn before the value. */
	bar?: (row: T) => number;
	/** Cell tooltip. */
	title?: (row: T) => string | undefined;
	muted?: boolean | ((row: T) => boolean);
	/** A loss, an overrun: the value turns the destructive colour. */
	negative?: (row: T) => boolean;
	/** The column the eye lands on first. */
	strong?: boolean;
	/** A hairline before this column, opening a group. */
	rule?: boolean;
	/** Hidden under this breakpoint. */
	hideBelow?: DataColumnBreakpoint;
};
</script>

<script lang="ts" generics="T">
/*
 * The one data table: wide lead cell, fixed figure columns, sortable heads,
 * optional pager. A row opens by `rowHref` or `onRowClick`, stretched over the row from the lead.
 */
import { cn } from "#src/lib/utils.js";
import DataSortHead from "#src/charts/dashboard/data-sort-head.svelte";
import RatingChip from "#src/charts/dashboard/rating-chip.svelte";
import { Pagination, paginateRows, totalPages } from "#src/components/data-table/index.js";
import {
	dataTableClass,
	dataTdClass,
	dataTdNumClass,
	dataThClass,
	dataThNumClass,
	dataTheadClass,
	dataTrClass,
} from "#src/charts/dashboard/data-table.js";

interface Props {
	rows: T[];
	columns: DataColumn<T>[];
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
	/** The row opens a page. The lead becomes the link. */
	rowHref?: (row: T) => string;
	/** The row opens in place: a panel, a detail view. The lead becomes the button. */
	onRowClick?: (row: T) => void;
	/** Placeholder rows while the data is on its way. */
	loading?: boolean;
	/** Drawn in place of the body when there are no rows. */
	empty?: Snippet;
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
	rowHref,
	onRowClick,
	loading = false,
	empty,
}: Props = $props();

const pad = "px-3";
const LOADING_ROWS = 5;

// Literal classes, so Tailwind sees each one.
const HIDE_BELOW: Record<DataColumnBreakpoint, string> = {
	sm: "hidden sm:table-cell",
	md: "hidden md:table-cell",
	lg: "hidden lg:table-cell",
};

// The ::after covers the whole row, so any cell opens it and the lead stays the one tab stop.
const stretch =
	"text-left outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring";

const sorted = $derived.by(() => {
	const by = columns.find((column) => column.key === sortKey)?.sort;
	if (!by) return rows;
	const direction = descending ? -1 : 1;
	return [...rows].sort((left, right) => (by(left) - by(right)) * direction);
});

const visible = $derived(pageSize ? paginateRows(sorted, page, pageSize) : sorted);
const opens = $derived(Boolean(rowHref || onRowClick));

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

function isMuted(column: DataColumn<T>, row: T) {
	return typeof column.muted === "function" ? column.muted(row) : Boolean(column.muted);
}

function columnClass(column: DataColumn<T>) {
	return cn(
		pad,
		column.align === "start" && "text-left",
		column.rule && "border-l border-border",
		column.hideBelow && HIDE_BELOW[column.hideBelow],
	);
}
</script>

<table class={cn(dataTableClass, minWidth, "table-fixed")}>
	<colgroup>
		<col class={leadWidth} />
		{#each columns as column (column.key)}
			<col class={cn(column.width, column.hideBelow && HIDE_BELOW[column.hideBelow])} />
		{/each}
	</colgroup>
	<thead class={dataTheadClass}>
		<tr>
			<th scope="col" class={dataThClass}>{leadLabel}</th>
			{#each columns as column (column.key)}
				{#if column.sort}
					<DataSortHead
						numeric={column.align !== "start"}
						class={columnClass(column)}
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
						class={cn(column.align === "start" ? dataThClass : dataThNumClass, columnClass(column))}
						title={column.hint}
					>
						{column.label}
					</th>
				{/if}
			{/each}
		</tr>
	</thead>
	<tbody>
		{#if loading}
			{#each { length: LOADING_ROWS }, index (index)}
				<tr class={dataTrClass} aria-hidden="true">
					<td class={cn(dataTdClass, "py-3")}>
						<span class="block h-4 w-2/3 animate-pulse rounded bg-muted"></span>
					</td>
					{#each columns as column (column.key)}
						<td class={cn(dataTdNumClass, columnClass(column), "align-middle")}>
							<span
								class={cn(
									"block h-4 w-3/4 animate-pulse rounded bg-muted",
									column.align !== "start" && "ml-auto",
								)}
							></span>
						</td>
					{/each}
				</tr>
			{/each}
		{:else if visible.length === 0 && empty}
			<tr>
				<td colspan={columns.length + 1}>{@render empty()}</td>
			</tr>
		{:else}
			{#each visible as row (rowKey(row))}
				<tr class={cn(dataTrClass, "group", opens && "relative cursor-pointer")}>
					<td class={cn(dataTdClass, "py-3")}>
						{#if rowHref}
							<a href={rowHref(row)} class={stretch}>{@render lead(row)}</a>
						{:else if onRowClick}
							<button type="button" class={stretch} onclick={() => onRowClick(row)}>
								{@render lead(row)}
							</button>
						{:else}
							{@render lead(row)}
						{/if}
					</td>
					{#each columns as column (column.key)}
						<td
							class={cn(
								dataTdNumClass,
								columnClass(column),
								"align-middle whitespace-nowrap",
								column.strong && "font-medium",
								isMuted(column, row) && "text-muted-foreground",
								column.negative?.(row) && "text-destructive",
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
								{:else if column.bar}
									<span class="flex items-center justify-end gap-3">
										<span class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
											<span
												class="block h-full origin-left rounded-full bg-primary/70"
												style:transform="scaleX({Math.min(1, Math.max(0, column.bar(row)))})"
											></span>
										</span>
										<span>{value}</span>
									</span>
								{:else}
									{value}
								{/if}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		{/if}
	</tbody>
</table>
{#if pageSize && !loading}
	<Pagination {page} {pageSize} total={sorted.length} onPageChange={(next) => (page = next)} />
{/if}
