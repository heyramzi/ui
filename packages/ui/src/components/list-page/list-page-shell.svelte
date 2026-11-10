<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { flushSync, tick, untrack, type Snippet } from "svelte";
	import { MagnifyingGlass, X } from "phosphor-svelte";
	import { toolbarTriggerClass } from "#src/components/toolbar/toolbar-trigger.js";
	import EmptyState from "#src/components/list-page/empty-state.svelte";
	import { cn } from "#src/lib/utils.js";
	import { pageGutterClass } from "#src/lib/layout.js";
	import { getSectionHost } from "#src/components/list-page/section-host.js";
	import SectionRuns from "#src/components/segmented/section-runs.svelte";
	import { naturalRowWidth, setToolbarDensity } from "#src/components/list-page/toolbar-density.js";
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
	let row = $state<HTMLElement>();
	// How far the row has folded to stay on one line. 0 is full size; 1 folds
	// the tabs into a dropdown; 2 also drops the filter and display labels;
	// 3 also turns search into an icon that opens the field across the row.
	type Level = 0 | 1 | 2 | 3;
	const DEEPEST: Level = 3;
	let level = $state<Level>(0);
	let searchOpen = $state(false);
	let searchLayer = $state<HTMLElement>();
	setToolbarDensity({
		get compact() {
			return level >= 1;
		},
		get tight() {
			return level >= 2;
		},
	});

	// =========================
	// HANDLERS
	// =========================
	// Focus lands in the field, since opening it is asking to type.
	async function openSearch() {
		searchOpen = true;
		await tick();
		searchLayer?.querySelector<HTMLElement>("input, [contenteditable]")?.focus();
	}

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
	// Widened past the last fold, the field is back in the row, so the open
	// layer has nothing left to cover.
	$effect(() => {
		if (level < DEEPEST) searchOpen = false;
	});
	// One row, never two (Ramzi, 9 Nov 2026): /tasks at 1500px put its status
	// tabs and actions on a second line under search and filters.
	// Then 620px and 420px still wrapped, the filters on a line of their own, so
	// a second fold drops their labels (10 Nov 2026).
	// WHY each level's width is remembered: a folded row only holds the smaller
	// controls, and a probe of it can't say whether the larger ones would fit.
	// The probe refreshes the current level's entry, so new counts or chips
	// cost at most one extra step before the row settles.
	$effect(() => {
		if (!row) return;
		const el = row;
		const needs = [Infinity, Infinity, Infinity, Infinity];
		let frame = 0;
		// WHY settled in one pass with flushSync, not a frame per level: a phone
		// load walked 0 to 3 over four frames, and axe read the squeezed search
		// field in between (gallery, 390px).
		const measure = () => {
			frame = 0;
			for (let step = 0; step <= DEEPEST * 2; step++) {
				const room = el.clientWidth + 0.5;
				const at = untrack(() => level);
				needs[at] = naturalRowWidth(el);
				let next = at;
				if (needs[at] > room && at < DEEPEST) next = (at + 1) as Level;
				else if (at > 0 && needs[at - 1] <= room) next = (at - 1) as Level;
				if (next === at) return;
				flushSync(() => (level = next));
			}
		};
		// A frame's delay folds a burst of resizes into one probe and keeps the
		// observer from looping on its own state change.
		const schedule = () => (frame ||= requestAnimationFrame(measure));
		const observer = new ResizeObserver(schedule);
		observer.observe(el);
		for (const child of el.children) observer.observe(child);
		// Scheduled, not called: a direct call would make this effect track
		// `compact` and rerun on every fold, dropping the remembered width.
		schedule();
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
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
			<!-- The row never wraps. Short of room it folds the tabs, then drops the
			     filter and display labels; past that, search and the filters strip
			     shrink and the strip scrolls. The actions never shrink. -->
			<!-- Sticky, because the section tabs live here. `-mx-4 px-4` covers the
			     gutter, `-mt-4 py-4` pulls the top padding inside the sticky box. -->
			<!-- `data-fold` lets a caller's own control fold too: a primary button
			     writes `group-data-[fold=3]/toolbar:sr-only` on its label. -->
			<div
				data-fold={level}
				class="group/toolbar @container/toolbar sticky top-0 z-20 -mx-4 -mt-4 bg-card/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/70"
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
					<div
						bind:this={row}
						class={cn(
							"relative flex min-w-0 flex-1 flex-nowrap items-center",
							// Icon triggers sit closer: at 390px the last fold was 4px over.
							level >= 2 ? "gap-1.5" : "gap-2",
							toolbarClass,
						)}
					>
						{#if search && level < DEEPEST}
							<div class="flex min-w-0 shrink items-center">
								{@render search()}
							</div>
						{:else if search && !searchOpen}
							<!-- WHY a fold and not a squeeze: at 390px the field shrank under
							     axe's 24px target size and showed two letters of its placeholder. -->
							<button
								type="button"
								class={toolbarTriggerClass({
									className: "aspect-square shrink-0 justify-center px-0",
								})}
								aria-label={searchLabel}
								title={searchLabel}
								onclick={openSearch}
							>
								<MagnifyingGlass aria-hidden="true" class="size-3.5" />
							</button>
						{:else if search}
							<!-- Open, the field covers the whole row; Escape or the close
							     button hands the row back, with the query kept. -->
							<div
								bind:this={searchLayer}
								role="search"
								class="absolute inset-0 z-10 flex items-center gap-2 bg-card"
								onkeydown={(event) => {
									if (event.key === "Escape") searchOpen = false;
								}}
							>
								<div class="flex min-w-0 flex-1 items-center [&>*]:w-full [&>*]:max-w-none">
									{@render search()}
								</div>
								<button
									type="button"
									class={toolbarTriggerClass({
										className: "aspect-square shrink-0 justify-center px-0",
									})}
									aria-label={closeSearchLabel}
									onclick={() => (searchOpen = false)}
								>
									<X aria-hidden="true" class="size-3.5" />
								</button>
							</div>
						{/if}
						{#if filters}
							<!-- Tight, the strip stops shrinking: squeezed under its icon
							     trigger, the trigger slid beneath the tabs (420px). Its
							     chips scroll inside a capped width instead. -->
							<div
								class={cn(
									"no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto",
									level >= 2 ? "max-w-40 shrink-0" : "shrink",
								)}
							>
								{@render filters()}
							</div>
						{/if}
						{#if tabs || rightActions}
							<div
								class={cn(
									"flex shrink-0 items-center",
									level >= 2 ? "gap-1.5" : "gap-2",
									hasLeading ? "ms-auto" : "flex-1",
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
					</div>
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
