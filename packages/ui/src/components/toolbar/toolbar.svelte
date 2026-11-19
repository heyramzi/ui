<script lang="ts" generics="Tab extends string, View extends string">
	/*
	 * A list-page toolbar for a pane, with the data wired in: search, tabs and a
	 * view switch. It draws `ListPageShell`'s row, so it folds by measured width
	 * the same way, and a folded tab or view strip opens a `Picker`.
	 */

	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { SegmentedFilter } from "#src/components/segmented/index.js";
	import type { TabDef } from "#src/components/segmented/animated-tabs.svelte";
	import ToolbarSearch from "#src/components/toolbar/toolbar-search.svelte";
	import ToolbarRow from "#src/components/list-page/toolbar-row.svelte";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The search text. Leave it out for no search. */
		search?: string;
		searchPlaceholder?: string;
		/** The search box's name, and the folded search button's. Translate at the call site. */
		searchLabel?: string;
		/** The close button's name once the folded search is open. */
		closeSearchLabel?: string;
		/** A strip of tabs, such as All, Open and Done. */
		tabs?: readonly TabDef<Tab>[];
		tab?: Tab;
		tabsLabel?: string;
		/** How the page shows its records: a list, a board, a grid. Each one needs an icon. */
		views?: readonly (TabDef<View> & { icon: NonNullable<TabDef<View>["icon"]> })[];
		view?: View;
		viewLabel?: string;
		/** Controls that stay on the row at every width, such as filter chips. They scroll sideways before they wrap. */
		filters?: Snippet;
		/** The primary action and its neighbours, pinned to the right edge. */
		actions?: Snippet;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		search = $bindable(),
		searchPlaceholder = "Search...",
		searchLabel = "Search",
		closeSearchLabel = "Close search",
		tabs,
		tab = $bindable(),
		tabsLabel = "Show",
		views,
		view = $bindable(),
		viewLabel = "View",
		filters,
		actions,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let hasSearch = $derived(search !== undefined);
	let hasTabs = $derived(Boolean(tabs && tab !== undefined));
	let hasViews = $derived(Boolean(views && view !== undefined));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet searchField()}
	<ToolbarSearch
		bind:value={() => search ?? "", (next) => (search = next)}
		placeholder={searchPlaceholder}
		label={searchLabel}
		size="sm"
		class="w-56 max-w-full"
	/>
{/snippet}

<!-- The row's own gap, so the two strips don't touch: 8px, 6px once labels drop. -->
{#snippet strips()}
	<div
		class="flex min-w-0 items-center gap-2 group-data-[fold=2]/toolbar:gap-1.5 group-data-[fold=3]/toolbar:gap-1.5"
	>
		{#if tabs && tab !== undefined}
			<SegmentedFilter options={tabs} bind:value={tab} ariaLabel={tabsLabel} block={false} />
		{/if}
		{#if views && view !== undefined}
			<SegmentedFilter options={views} bind:value={view} ariaLabel={viewLabel} block={false} />
		{/if}
	</div>
{/snippet}

<!-- The same container the shell gives its row, so the search box lets go of
     its desk width at the same pane width. -->
<div class={cn("@container/toolbar flex min-w-0", className)}>
	<ToolbarRow
		search={hasSearch ? searchField : undefined}
		{filters}
		tabs={hasTabs || hasViews ? strips : undefined}
		rightActions={actions}
		{searchLabel}
		{closeSearchLabel}
	/>
</div>
