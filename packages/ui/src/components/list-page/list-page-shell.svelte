<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import EmptyState from "#src/components/list-page/empty-state.svelte";
	import { cn } from "#src/lib/utils.js";
	import { pageGutterClass } from "#src/lib/layout.js";
	import { getSectionHost } from "#src/components/list-page/section-host.js";
	import SectionRuns from "#src/components/segmented/section-runs.svelte";
	import ToolbarRow from "#src/components/list-page/toolbar-row.svelte";
	import type { PhosphorIcon, IconWeight } from "#src/lib/icon-types.js";

	// =========================
	// TYPES
	// =========================
	type EmptyConfig = {
		icon?: PhosphorIcon;
		iconWeight?: IconWeight;
		title: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
		actionHref?: string;
	};

	interface Props {
		isEmpty?: boolean;
		emptyState?: EmptyConfig;
		hideToolbarWhenEmpty?: boolean;
		maxWidth?: string | false;
		fillHeight?: boolean;
		containerClass?: string;
		toolbarClass?: string;
		tabs?: Snippet;
		search?: Snippet;
		filters?: Snippet;
		rightActions?: Snippet;
		summary?: Snippet;
		content?: Snippet;
		empty?: Snippet;
		extra?: Snippet;
		/** The folded search icon's name, on a toolbar too narrow for the field.
		 *  Translate at the call site. */
		searchLabel?: string;
		/** The close button's name once the folded search is open. */
		closeSearchLabel?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		isEmpty = false,
		emptyState,
		hideToolbarWhenEmpty = false,
		maxWidth = "1600px",
		fillHeight = false,
		containerClass,
		toolbarClass,
		tabs,
		search,
		filters,
		rightActions,
		summary,
		content,
		empty,
		extra,
		searchLabel = "Search",
		closeSearchLabel = "Close search",
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	// Null off an app shell, where the toolbar just has no section strip to draw.
	const section = getSectionHost();

	// =========================
	// DERIVED
	// =========================
	let hideChrome = $derived(isEmpty && hideToolbarWhenEmpty);
	// WHY the section strip counts: on a page whose only chrome is the section
	// nav, this row is what draws it, and skipping the row would drop the tabs.
	let hasToolbar = $derived(
		Boolean(search || filters || tabs || rightActions || section?.strip) && !hideChrome,
	);

	// =========================
	// EFFECTS
	// =========================
	// Claiming stops the app shell drawing its own strip above this page.
	// Unmount releases it, so shell-less pages get the standalone row back.
	$effect(() => {
		if (!hasToolbar) return;
		return section?.claim();
	});
	// The shared gutter from `lib/layout.ts`. A typed one put the search field
	// 8px left of the section tabs above it.
	let outerClass = $derived(
		cn(
			`flex flex-col gap-4 py-4 ${pageGutterClass}`,
			fillHeight && "min-h-0 flex-1",
			!fillHeight && "flex-1",
			containerClass,
		),
	);
	// flex-1 lets a snippet pin a footer with mt-auto. min-w-0 keeps wide
	// tables and chip rows from causing horizontal scroll.
	let innerClass = $derived(
		maxWidth === false
			? cn("flex min-w-0 flex-1 flex-col gap-4", fillHeight && "min-h-0")
			: cn("mx-auto flex w-full min-w-0 flex-1 flex-col gap-4", fillHeight && "min-h-0"),
	);
	let innerStyle = $derived(maxWidth ? `max-width: ${maxWidth}` : undefined);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={outerClass}>
	<div class={innerClass} style={innerStyle}>
		{#if hasToolbar}
			<!-- One row on every list page: search and filters left, then tabs,
			     view toggle and primary action right. -->
			<!-- Sticky, because the section tabs live here. `-mx-4 px-4` covers the
			     gutter, `-mt-4 py-4` pulls the top padding inside the sticky box. -->
			<div
				class="@container/toolbar sticky top-0 z-20 -mx-4 -mt-4 bg-card/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/70"
			>
				<!-- WHY the section strip sits outside the measured row: it's the nav
				     between pages, and under 768px it takes a line of its own above the
				     toolbar. Counted in the probe, it folded controls that had room. -->
				<!-- A container query, not a breakpoint: an 834px iPad read as desktop
				     and clipped a 733px toolbar into a 538px column. -->
				<div class="flex flex-wrap items-center gap-2">
					{#if section?.strip}
						<SectionRuns strip={section.strip} class="w-full max-w-full @3xl/toolbar:w-auto" />
					{/if}
					<ToolbarRow
						{search}
						{filters}
						{tabs}
						{rightActions}
						anchored={Boolean(section?.strip)}
						{searchLabel}
						{closeSearchLabel}
						class={toolbarClass}
					/>
				</div>
			</div>
		{/if}

		{#if summary && !hideChrome}
			{@render summary()}
		{/if}

		{#if extra && !hideChrome}
			{@render extra()}
		{/if}

		{#if isEmpty}
			{#if empty}
				{@render empty()}
			{:else if emptyState}
				<EmptyState {...emptyState} />
			{/if}
		{:else if content}
			{@render content()}
		{/if}
	</div>
</div>
