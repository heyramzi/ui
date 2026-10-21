<script lang="ts" module>
	import type { SegmentedNavItem } from "#src/components/segmented/segmented-nav.svelte";

	/** One bordered track on the section row. A run with a `label` is a reference
	 *  set, not a step, so `SectionRuns` titles it and sends it right. */
	export interface SectionRun {
		label?: string;
		items: readonly SegmentedNavItem[];
		/** Overrides the strip's `current` for this run, so two nested runs each light one tab. */
		current?: string;
	}

	// WHY runs: a section can hold a flow and the references it's read against.
	// Each run gets its own track so they don't read as one sequence.
	/** What an app shell publishes so a page's toolbar can draw the section strip. */
	export interface SectionStrip {
		runs: readonly SectionRun[];
		current: string;
		ariaLabel: string;
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import SegmentedNav from "#src/components/segmented/segmented-nav.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		strip: SectionStrip;
		/** The host row's own constraints: order, width, container queries. */
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let { strip, class: className }: Props = $props();

	// =========================
	// DERIVED
	// =========================

	// The titled run takes the right edge, so a reference set reads apart from the steps.
	let firstTitled = $derived(strip.runs.findIndex((run) => run.label));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->

<!-- WHY it grows only with a titled run: `ml-auto` needs room to push into, and
     a one-run strip keeps its width beside the search. -->
<div
	class={cn(
		"no-scrollbar flex min-w-0 items-center gap-x-3 overflow-x-auto",
		firstTitled >= 0 && "flex-1",
		className,
	)}
>
	{#each strip.runs as run, index (index)}
		<div class={cn("flex shrink-0 items-center gap-2", index === firstTitled && "ml-auto")}>
			{#if run.label}
				<span class="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
					{run.label}
				</span>
			{/if}
			<SegmentedNav
				items={run.items}
				current={run.current ?? strip.current}
				ariaLabel={run.label ?? strip.ariaLabel}
			/>
		</div>
	{/each}
</div>
