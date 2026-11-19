<script lang="ts">
	/*
	 * The one list-page toolbar row: search and filters left, tabs and actions
	 * right, folding by measured width so it never wraps. `ListPageShell` draws it
	 * under its section strip, and `Toolbar` draws it alone inside a pane.
	 */

	// =========================
	// IMPORTS
	// =========================
	import { flushSync, tick, untrack, type Snippet } from "svelte";
	import { MagnifyingGlass, X } from "phosphor-svelte";
	import { toolbarTriggerClass } from "#src/components/toolbar/toolbar-trigger.js";
	import { cn } from "#src/lib/utils.js";
	import { naturalRowWidth, setToolbarDensity } from "#src/components/list-page/toolbar-density.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		search?: Snippet;
		filters?: Snippet;
		tabs?: Snippet;
		rightActions?: Snippet;
		/** Something outside the row holds its left edge (the shell's section strip),
		 *  so the tabs stay right even with no search or filters. */
		anchored?: boolean;
		/** The folded search icon's name. Translate at the call site. */
		searchLabel?: string;
		/** The close button's name once the folded search is open. */
		closeSearchLabel?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		search,
		filters,
		tabs,
		rightActions,
		anchored = false,
		searchLabel = "Search",
		closeSearchLabel = "Close search",
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
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
	// Whether anything holds the left of the row. With nothing there, the tabs
	// take that edge instead of floating mid-row beside the actions.
	let hasLeading = $derived(Boolean(search || filters || anchored));

	// =========================
	// EFFECTS
	// =========================
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
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The row never wraps. Short of room it folds the tabs, then drops the filter
     and display labels; past that, search and the filters strip shrink and the
     strip scrolls. The actions never shrink. -->
<!-- `data-fold` lets a caller's own control fold too: a primary button writes
     `group-data-[fold=3]/toolbar:sr-only` on its label. -->
<div
	bind:this={row}
	data-fold={level}
	class={cn(
		"group/toolbar relative flex min-w-0 flex-1 flex-nowrap items-center",
		// Icon triggers sit closer: at 390px the last fold was 4px over.
		level >= 2 ? "gap-1.5" : "gap-2",
		className,
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
		     button hands the row back, with the query kept. The keydown only
		     hears Escape bubbling up from the field inside. -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
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
