<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import EmptyState from "#src/components/list-page/empty-state.svelte";
	import { cn } from "@heyramzi/utils";
	import { pageGutterClass } from "#src/lib/layout.js";
	import { getSectionHost } from "#src/components/list-page/section-host.js";
	import SectionRuns from "#src/components/segmented/section-runs.svelte";
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

	type Props = {
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
	};

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
	// Whether anything holds the left of the row. With nothing there, the tabs
	// take that edge instead of floating mid-row beside the actions.
	let hasLeading = $derived(Boolean(search || filters || section?.strip));

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
			: cn(
					"mx-auto flex w-full min-w-0 flex-1 flex-col gap-4",
					fillHeight && "min-h-0",
				),
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
			<!-- Without room, `order` keeps the actions beside search and drops
			     filters to a scrolling line below. flex-wrap stays on at every width. -->
			<!-- A container query, not a breakpoint: an 834px iPad read as desktop
			     and clipped a 733px toolbar into a 538px column. -->
			<!-- Sticky, because the section tabs live here. `-mx-4 px-4` covers the
			     gutter, `-mt-4 py-4` pulls the top padding inside the sticky box. -->
			<div
				class="@container/toolbar sticky top-0 z-20 -mx-4 -mt-4 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70"
			>
				<div class={cn("flex flex-wrap items-center gap-2", toolbarClass)}>
					<!-- The section tabs lead: which page comes before which slice of it.
					     One row replaces two rows that held four controls. -->
					{#if section?.strip}
						<SectionRuns
							strip={section.strip}
							class="order-first w-full max-w-full @3xl/toolbar:w-auto"
						/>
					{/if}
					{#if search}
						<div class="order-1 flex min-w-0 flex-1 items-center @3xl/toolbar:flex-none">
							{@render search()}
						</div>
					{/if}
					{#if tabs || rightActions}
						<!-- Shrinks and wraps, not shrink-0: /tasks needs 610px here, and
						     shrink-0 clipped its last control off an iPad screen. -->
						<div
							class={cn(
								"order-2 flex min-w-0 flex-wrap items-center gap-2 @3xl/toolbar:order-3",
								hasLeading ? "@3xl/toolbar:ms-auto" : "flex-1",
							)}
						>
							{#if tabs}
								<div class={cn("flex min-w-0 items-center", !hasLeading && "me-auto")}>
									{@render tabs()}
								</div>
							{/if}
							{#if rightActions}
								{@render rightActions()}
							{/if}
						</div>
					{/if}
					{#if filters}
						<div
							class="no-scrollbar order-3 flex w-full max-w-full min-w-0 items-center gap-2 overflow-x-auto @3xl/toolbar:order-2 @3xl/toolbar:w-auto"
						>
							{@render filters()}
						</div>
					{/if}
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
