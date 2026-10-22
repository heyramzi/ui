<script lang="ts" generics="Tab extends string, View extends string">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { CaretDown, MagnifyingGlass } from "phosphor-svelte";
	import { SegmentedFilter } from "#src/components/segmented/index.js";
	import type { TabDef } from "#src/components/segmented/animated-tabs.svelte";
	import { toolbarTriggerClass } from "#src/components/toolbar/toolbar-trigger.js";
	import ToolbarSearch from "#src/components/toolbar/toolbar-search.svelte";
	import { Input } from "#src/shadcn/input/index.js";
	import * as DropdownMenu from "#src/shadcn/dropdown-menu/index.js";
	import * as Popover from "#src/shadcn/popover/index.js";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The search text. Leave it out for no search. */
		search?: string;
		searchPlaceholder?: string;
		/** The label of the narrow search button. Translate at the call site. */
		searchLabel?: string;
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
	let currentTab = $derived(tabs?.find((t) => t.value === tab));
	let currentView = $derived(views?.find((v) => v.value === view));
	let searching = $derived(Boolean(search));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY a container query: the toolbar sits in a pane that is narrower than the screen, and a
     breakpoint reads the screen. WHY nowrap: a second row pushes the content down and moves the
     page as a search is opened. Search, tabs and view are the three that fold, each into the one
     menu that holds them; both forms are in the DOM and the query shows one, so there is no
     measuring and no flash on first paint. -->
<div class={cn("@container/toolbar min-w-0", className)}>
	<div class="flex flex-nowrap items-center gap-2">
		{#if search !== undefined}
			<div class="w-56 shrink-0 @max-2xl/toolbar:hidden">
				<ToolbarSearch bind:value={search} placeholder={searchPlaceholder} />
			</div>
			<Popover.Root>
				<Popover.Trigger
					aria-label={searchLabel}
					class={cn(toolbarTriggerClass({ active: searching }), "@2xl/toolbar:hidden")}
				>
					<MagnifyingGlass class="size-3.5" aria-hidden="true" />
				</Popover.Trigger>
				<Popover.Content align="start" class="w-64 p-2">
					<Input bind:value={search} placeholder={searchPlaceholder} aria-label={searchLabel} class="h-8" />
				</Popover.Content>
			</Popover.Root>
		{/if}

		{#if tabs && tab !== undefined}
			<SegmentedFilter
				options={tabs}
				bind:value={tab}
				ariaLabel={tabsLabel}
				block={false}
				class="@max-2xl/toolbar:hidden"
			/>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					aria-label={tabsLabel}
					class={cn(toolbarTriggerClass(), "min-w-0 @2xl/toolbar:hidden")}
				>
					<span class="truncate">{currentTab?.label}</span>
					<CaretDown class="size-3 shrink-0" aria-hidden="true" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start">
					<DropdownMenu.RadioGroup bind:value={tab}>
						{#each tabs as item (item.value)}
							<DropdownMenu.RadioItem value={item.value}>
								{item.label}
								{#if item.count != null}
									<span class="ms-auto pe-2 text-xs text-muted-foreground tabular-nums">{item.count}</span>
								{/if}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}

		{#if filters}
			<div class="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
				{@render filters()}
			</div>
		{:else}
			<div class="flex-1"></div>
		{/if}

		{#if views && view !== undefined}
			<SegmentedFilter
				options={views}
				bind:value={view}
				ariaLabel={viewLabel}
				block={false}
				class="@max-2xl/toolbar:hidden"
			/>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					aria-label={viewLabel}
					class={cn(toolbarTriggerClass(), "@2xl/toolbar:hidden")}
				>
					{#if currentView}
						<currentView.icon class="size-3.5" aria-hidden="true" />
					{/if}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.RadioGroup bind:value={view}>
						{#each views as item (item.value)}
							<DropdownMenu.RadioItem value={item.value}>
								<item.icon class="size-4" aria-hidden="true" />
								{item.label}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}

		{#if actions}
			<div class="flex shrink-0 items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
