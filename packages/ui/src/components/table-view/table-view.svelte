<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { TableColumn } from "#src/components/table-view/types.js";

	export type TableCell<Row> = { row: Row; column: TableColumn<Row>; value: unknown; text: string };
	export type TableGroup<Row> = { key: string; rows: Row[] };
	export type { TableColumn };
</script>

<script lang="ts" generics="Row extends object">
	// =========================
	// IMPORTS
	// =========================
	import { CaretDown } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import * as Table from "#src/shadcn/table/index.js";
	import * as ContextMenu from "#src/shadcn/context-menu/index.js";
	import { Checkbox } from "#src/shadcn/checkbox/index.js";
	import { SortableHead, TableSkeleton } from "#src/components/data-table/index.js";
	import GroupHead from "#src/components/work-parts/group-head.svelte";
	import { toggleSort, type SortState } from "#src/components/data-table/data-table.js";
	import { MENU_KEYS, openMenuFromKey } from "#src/components/data-table/menu-key.js";

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
		/**
		 * Below this width the table scrolls sideways inside its frame. Defaults to the columns'
		 * own widths (8rem a text column, 5rem a number), so a phone scrolls rather than splits words.
		 * Pass "0" for a table that should squeeze.
		 */
		minWidth?: string;
		class?: string;
		/** The sorted column and its direction. Bind it; columns with `sortable` set it. */
		sort?: SortState<Row>;
		/** Where a row goes. Draws a real link over the row, so middle-click and cmd-click work. */
		rowHref?: (row: Row) => string | undefined;
		/** Runs on a plain left click of the row link. Call `event.preventDefault()` to open in place; a modified click still follows `href`. */
		onRowLink?: (row: Row, event: MouseEvent) => void;
		/** The link's accessible name. Defaults to the row's first column text. */
		rowLabel?: (row: Row) => string;
		/** Adds a checkbox column with a select-all in the head. */
		selectable?: boolean;
		/** The `rowKey` of every checked row. Bind it. */
		selected?: Set<string>;
		selectAllLabel?: string;
		selectRowLabel?: (row: Row) => string;
		/** The hidden head of the last column, the one holding each row's link or button. */
		openColumnLabel?: string;
		/** The items of a row menu: `ContextMenu.Item`s. Right-click, a long press, Shift+F10 or the ContextMenu key opens it. */
		rowMenu?: Snippet<[Row]>;
		/** Rows that return the same key sit under one header row, and `null` rows sit with no header. Order `rows` so a group is contiguous. */
		group?: (row: Row) => string | null;
		/** Draws a group's header. Prints the key when left out. */
		groupHeader?: Snippet<[TableGroup<Row>]>;
		/** Makes each group header a button that folds its rows. */
		collapsible?: boolean;
		/** The keys of the folded groups. Bind it. */
		collapsed?: Set<string>;
		/** Draws a column head its own way, an icon or a colour. Print `column.label` for the plain case. */
		head?: Snippet<[TableColumn<Row>]>;
		/** The row opens in place, from a button over the row named like the row link. */
		onRowClick?: (row: Row) => void;
		/** Whether a row shows its `subRow`. */
		expanded?: (row: Row) => boolean;
		/** A full-width row under the row, for detail. */
		subRow?: Snippet<[Row]>;
		/** Drawn across every column when there are no rows. */
		empty?: Snippet;
		/** Drawn across every column under the last row: a load-more sentinel or a spinner. */
		trailing?: Snippet;
		/** Draws placeholder rows in the same frame instead of `rows`. */
		loading?: boolean;
		skeletonRows?: number;
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
		minWidth,
		class: className,
		sort = $bindable(null),
		rowHref,
		onRowLink,
		rowLabel,
		selectable = false,
		selected = $bindable(new Set<string>()),
		selectAllLabel = "Select all rows",
		selectRowLabel,
		openColumnLabel = "Open",
		rowMenu,
		group,
		groupHeader,
		collapsible = false,
		collapsed = $bindable(new Set<string>()),
		head,
		onRowClick,
		expanded,
		subRow,
		empty,
		trailing,
		loading = false,
		skeletonRows = 5,
	}: Props = $props();

	// Names each group's body, so a fold button can say which rows it folds.
	const uid = $props.id();

	// =========================
	// DERIVED
	// =========================
	// A row that opens has a last cell for its link or button.
	let opens = $derived(Boolean(rowHref || onRowClick));
	let span = $derived(columns.length + (selectable ? 1 : 0) + (opens ? 1 : 0));
	// WHY a floor from the columns: with none, a 390px panel squeezed a text column until it broke
	// "Handover" mid-word. A column hidden on small screens doesn't count, since it's gone there.
	let floor = $derived.by(() => {
		const parts = columns
			.filter((c) => !c.hideBelow)
			.map((c) =>
				c.width && /^[\d.]+(rem|px)$/.test(c.width) ? c.width : c.numeric ? "5rem" : "8rem",
			);
		if (selectable) parts.push("2.5rem");
		return parts.length ? `calc(${parts.join(" + ")})` : "0";
	});
	let selectedCount = $derived(rows.filter((row) => selected.has(rowKey(row))).length);
	let allSelected = $derived(rows.length > 0 && selectedCount === rows.length);
	let someSelected = $derived(selectedCount > 0 && !allSelected);
	let skeletonColumns = $derived([
		...(selectable ? [{ width: "w-4" }] : []),
		...columns.map((column) => ({
			align: column.numeric ? ("right" as const) : ("left" as const),
		})),
	]);
	type Run = { id: string; key: string | null; rows: Row[] };
	let entries = $derived.by<Run[]>(() => {
		if (!group) return [];
		const out: Run[] = [];
		let current: Run | undefined;
		for (const row of rows) {
			const groupKey = group(row);
			if (!current || current.key !== groupKey) {
				current = { id: groupKey ?? `\u0000${out.length}`, key: groupKey, rows: [] };
				out.push(current);
			}
			current.rows.push(row);
		}
		return out;
	});

	// =========================
	// FUNCTIONS
	// =========================
	const key = (column: TableColumn<Row>) => column.key;

	function textOf(column: TableColumn<Row>, row: Row): string {
		const value = (row as Record<string, unknown>)[key(column)];
		if (column.format) return column.format(value, row);
		// WHY: a raw 1284 or 0.30000000000000004 in an amount column. Only `numeric`
		// columns: an unformatted year or id must print as it is.
		if (column.numeric && typeof value === "number") {
			return Number.isFinite(value) ? value.toLocaleString() : "";
		}
		return value === null || value === undefined ? "" : String(value);
	}

	function toggleRow(row: Row, on: boolean) {
		const next = new Set(selected);
		if (on) next.add(rowKey(row));
		else next.delete(rowKey(row));
		selected = next;
	}

	function toggleAll(on: boolean) {
		const next = new Set(selected);
		for (const row of rows) {
			if (on) next.add(rowKey(row));
			else next.delete(rowKey(row));
		}
		selected = next;
	}

	const HIDE = {
		sm: "hidden sm:table-cell",
		md: "hidden md:table-cell",
		lg: "hidden lg:table-cell",
	};

	function toggleGroup(groupKey: string) {
		const next = new Set(collapsed);
		if (next.has(groupKey)) next.delete(groupKey);
		else next.add(groupKey);
		collapsed = next;
	}

	// WHY the target check: a row can hold its own link, button or checkbox, and a click on one of those belongs to it.
	const OWN_CLICK =
		"a, button, input, select, textarea, label, [role=checkbox], [role=button], [role=menuitem]";

	function rowClick(event: MouseEvent, row: Row) {
		if ((event.target as Element).closest(OWN_CLICK)) return;
		onRowClick?.(row);
	}

	function linkClick(event: MouseEvent, row: Row) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
			return;
		onRowLink?.(row, event);
	}

	function linkName(row: Row): string {
		return rowLabel?.(row) ?? (columns[0] ? textOf(columns[0], row) : label);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet groupTitle(tableGroup: TableGroup<Row>, className?: string)}
	<!-- The th sets the type: GroupHead takes the name as markup, so no size of its own lands on it. -->
	<GroupHead class={className}>
		{#snippet title()}
			{#if groupHeader}{@render groupHeader(tableGroup)}{:else}{tableGroup.key}{/if}
		{/snippet}
	</GroupHead>
{/snippet}

{#snippet body(row: Row)}
	{#each columns as column (column.key)}
		<Table.Cell
			class={cn(
				"h-8 py-1.5 align-top any-pointer-coarse:h-11",
				// WHY break-words, not overflow-wrap anywhere: anywhere shrinks a cell's min-content to one
				// letter, so the table split words before it scrolled. break-words only splits a word
				// longer than the whole column, a URL.
				column.numeric ? "text-end tabular-nums" : "whitespace-normal break-words",
				column.muted && "text-muted-foreground",
				column.interactive && "relative z-10",
				column.hideBelow && HIDE[column.hideBelow],
				column.sticky && "bg-card sticky left-0 z-10",
				column.class,
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

{#snippet rowOrMenu(row: Row)}
	{#if rowMenu}
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				{#snippet child({ props })}
					<!-- A row with no link or button of its own takes focus itself, so the menu keys reach it. -->
					{@render dataRow(row, {
						...props,
						tabindex: rowHref?.(row) || onRowClick ? props.tabindex : 0,
						onkeydown: openMenuFromKey,
						"aria-keyshortcuts": MENU_KEYS,
					})}
				{/snippet}
			</ContextMenu.Trigger>
			<ContextMenu.Content class="w-48">
				{@render rowMenu(row)}
			</ContextMenu.Content>
		</ContextMenu.Root>
	{:else}
		{@render dataRow(row, {})}
	{/if}
{/snippet}

{#snippet dataRow(row: Row, triggerProps: Record<string, unknown>)}
	{@const href = rowHref?.(row)}
	{@const isSelected = selectable && selected.has(rowKey(row))}
	<Table.Row
		{...triggerProps}
		data-state={isSelected ? "selected" : undefined}
		onclick={onRowClick ? (event: MouseEvent) => rowClick(event, row) : undefined}
		class={cn(
			// Rows, not a card per row (DESIGN.md rule 19): a hairline under each and a flat
			// hover tint. The atom's row lifts; this one does not.
			"border-b border-border/70 last:border-b-0 hover:translate-y-0 hover:bg-foreground/3 hover:shadow-none",
			(href || onRowClick) && "relative t-press active:bg-foreground/6",
			onRowClick && "cursor-pointer",
			rowMenu && "outline-none focus-visible:shadow-(--ring-focus-inset)",
			rowClass?.(row),
		)}
	>
		{#if selectable}
			<Table.Cell class="relative z-10 w-10 align-top">
				<Checkbox
					checked={isSelected}
					onCheckedChange={(on) => toggleRow(row, on === true)}
					aria-label={selectRowLabel?.(row) ?? `Select ${linkName(row)}`}
				/>
			</Table.Cell>
		{/if}
		{@render body(row)}
		{#if href}
			<!-- WHY an empty anchor and not a wrapped cell: cells hold buttons and links of their own, and an anchor can't nest one. -->
			<td class="p-0">
				<a
					{href}
					aria-label={linkName(row)}
					onclick={onRowLink ? (event: MouseEvent) => linkClick(event, row) : undefined}
					class="absolute inset-0 z-0 outline-none focus-visible:shadow-(--ring-focus-inset)"
				></a>
			</td>
		{:else if onRowClick}
			<!-- The same overlay as a button, so a screen reader calls the row a control. -->
			<td class="p-0">
				<button
					type="button"
					aria-label={linkName(row)}
					onclick={() => onRowClick(row)}
					class="absolute inset-0 z-0 cursor-pointer outline-none focus-visible:shadow-(--ring-focus-inset)"
				></button>
			</td>
		{:else if opens}
			<td class="p-0"></td>
		{/if}
	</Table.Row>
	{#if subRow && expanded?.(row)}
		<Table.Row class="bg-foreground/2 hover:bg-foreground/2 hover:translate-y-0 hover:shadow-none">
			<Table.Cell colspan={span} class="whitespace-normal">
				{@render subRow(row)}
			</Table.Cell>
		</Table.Row>
	{/if}
{/snippet}

<!-- WHY no frame: the surface under a table is its frame, the white panel or a section card (DESIGN.md, Patterns: tables). -->
<div class={cn("min-w-0", className)}>
	<Table.Root
		aria-label={label}
		aria-busy={loading || undefined}
		style={`min-width: ${minWidth ?? floor}`}
		class="min-w-0"
	>
		<Table.Header class="bg-foreground/3">
			<Table.Row class="hover:translate-y-0 hover:bg-transparent hover:shadow-none">
				{#if selectable}
					<Table.Head class="w-10">
						<Checkbox
							checked={allSelected}
							indeterminate={someSelected}
							onCheckedChange={(on) => toggleAll(on === true)}
							aria-label={selectAllLabel}
							disabled={loading || rows.length === 0}
						/>
					</Table.Head>
				{/if}
				{#each columns as column (column.key)}
					{@const headClass = cn(
						"whitespace-normal",
						column.numeric && "text-end",
						column.hideBelow && HIDE[column.hideBelow],
						column.sticky && "bg-card sticky left-0 z-20",
						column.headClass ?? column.class,
					)}
					{@const headStyle = column.width ? `width: ${column.width}` : undefined}
					{#if column.sortable}
						<!-- A sticky head keeps its card under the hover tint, or rows show through it. -->
						<SortableHead
							key={column.key as keyof Row & string}
							{sort}
							onSort={(key) => (sort = toggleSort(sort, key))}
							numeric={column.numeric}
							class={cn(
								headClass,
								column.sticky &&
									"hover:bg-[color-mix(in_oklab,var(--color-foreground)_4%,var(--color-card))]",
							)}
							style={headStyle}
						>
							{#if head}{@render head(column)}{:else}{column.label}{/if}
						</SortableHead>
					{:else}
						<Table.Head class={headClass} style={headStyle}>
							{#if head}{@render head(column)}{:else}{column.label}{/if}
						</Table.Head>
					{/if}
				{/each}
				{#if opens}
					<th class="w-0 p-0"><span class="sr-only">{openColumnLabel}</span></th>
				{/if}
			</Table.Row>
		</Table.Header>
		{#if loading}
			<TableSkeleton rows={skeletonRows} columns={skeletonColumns} />
		{:else}
			{#if group}
				{#each entries as entry, index (entry.id)}
					{@const folded = entry.key !== null && collapsible && collapsed.has(entry.key)}
					{@const tableGroup = { key: entry.key ?? "", rows: entry.rows }}
					{@const bodyId = `${uid}-group-${index}`}
					<Table.Body id={bodyId}>
						{#if entry.key !== null}
							<Table.Row
								class="bg-foreground/4 hover:translate-y-0 hover:bg-foreground/4 hover:shadow-none"
							>
								<Table.Head colspan={span} scope="colgroup" class="text-foreground h-8 p-0">
									{#if collapsible}
										<button
											type="button"
											aria-expanded={!folded}
											aria-controls={bodyId}
											class="t-press flex h-8 w-full items-center gap-2 px-2 text-start outline-none focus-visible:shadow-(--ring-focus-inset)"
											onclick={() => toggleGroup(tableGroup.key)}
										>
											<CaretDown
												class={cn(
													"size-3.5 shrink-0 transition-transform duration-fast ease-smooth-out motion-reduce:transition-none",
													folded && "-rotate-90",
												)}
												aria-hidden="true"
											/>
											{@render groupTitle(tableGroup)}
										</button>
									{:else}
										<!-- No gap: unlike the toggle, a fixed head never spaced its parts. -->
										<div class="flex h-8 items-center px-2">
											{@render groupTitle(tableGroup, "gap-0")}
										</div>
									{/if}
								</Table.Head>
							</Table.Row>
						{/if}
						{#if !folded}
							{#each entry.rows as row (rowKey(row))}
								{@render rowOrMenu(row)}
							{/each}
						{/if}
					</Table.Body>
				{/each}
			{:else}
				<Table.Body>
					{#each rows as row (rowKey(row))}
						{@render rowOrMenu(row)}
					{/each}
					{#if rows.length === 0 && empty}
						<Table.Row class="hover:bg-transparent hover:translate-y-0 hover:shadow-none">
							<Table.Cell colspan={span} class="whitespace-normal">{@render empty()}</Table.Cell>
						</Table.Row>
					{/if}
				</Table.Body>
			{/if}
			{#if trailing}
				<tbody>
					<tr><td colspan={span} class="p-0">{@render trailing()}</td></tr>
				</tbody>
			{/if}
		{/if}
		{#if footer}
			<Table.Footer>
				<Table.Row>
					{#if selectable}<Table.Cell></Table.Cell>{/if}
					{@render body(footer)}
					{#if opens}<td></td>{/if}
				</Table.Row>
			</Table.Footer>
		{/if}
	</Table.Root>
</div>
