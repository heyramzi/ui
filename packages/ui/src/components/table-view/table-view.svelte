<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { TableColumn } from "#src/components/table-view/types.js";

	export type TableCell<Row> = { row: Row; column: TableColumn<Row>; value: unknown; text: string };
	export type { TableColumn };
</script>

<script lang="ts" generics="Row extends object">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import * as Table from "#src/shadcn/table/index.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		columns: TableColumn<Row>[];
		rows: Row[];
		/** What names a row, so a filter keeps its rows in place. */
		rowKey: (row: Row) => string;
		/** What the table is, for a screen reader. */
		label: string;
		/** A totals row, drawn under the body in the same columns. */
		footer?: Row;
		/** Draws a cell its own way. Print `text` for the plain case. */
		cell?: Snippet<[TableCell<Row>]>;
		rowClass?: (row: Row) => string | undefined;
		/** Below this width the table scrolls sideways inside its frame. */
		minWidth?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		columns,
		rows,
		rowKey,
		label,
		footer,
		cell,
		rowClass,
		minWidth = "0",
		class: className,
	}: Props = $props();

	// =========================
	// FUNCTIONS
	// =========================
	const key = (column: TableColumn<Row>) => column.key;

	function textOf(column: TableColumn<Row>, row: Row): string {
		const value = (row as Record<string, unknown>)[key(column)];
		if (column.format) return column.format(value, row);
		return value === null || value === undefined ? "" : String(value);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet body(row: Row)}
	{#each columns as column (column.key)}
		<Table.Cell
			class={cn(
				"align-top",
				column.numeric ? "text-end tabular-nums" : "whitespace-normal",
				column.muted && "text-muted-foreground",
			)}
		>
			{#if cell}
				{@render cell({
					row,
					column,
					value: (row as Record<string, unknown>)[column.key],
					text: textOf(column, row),
				})}
			{:else}
				{textOf(column, row)}
			{/if}
		</Table.Cell>
	{/each}
{/snippet}

<div class={cn("overflow-hidden rounded-xl border", className)}>
	<Table.Root aria-label={label} style={`min-width: ${minWidth}`} class="min-w-0">
		<Table.Header>
			<Table.Row>
				{#each columns as column (column.key)}
					<Table.Head
						class={cn("whitespace-normal", column.numeric && "text-end")}
						style={column.width ? `width: ${column.width}` : undefined}
					>
						{column.label}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as row (rowKey(row))}
				<Table.Row class={rowClass?.(row)}>
					{@render body(row)}
				</Table.Row>
			{/each}
		</Table.Body>
		{#if footer}
			<Table.Footer>
				<Table.Row>
					{@render body(footer)}
				</Table.Row>
			</Table.Footer>
		{/if}
	</Table.Root>
</div>
