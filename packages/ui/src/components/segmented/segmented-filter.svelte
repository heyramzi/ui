<script lang="ts" generics="T extends string">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import Segment from "#src/components/segmented/segment.svelte";
	import type { TabDef } from "#src/components/segmented/animated-tabs.svelte";
	import SegmentedTrack from "#src/components/segmented/segmented-track.svelte";
	import SegmentedOverflow from "#src/components/segmented/segmented-overflow.svelte";
	import {
		SEGMENT_MAX,
		resolveSegmentMax,
		splitSegments,
	} from "#src/components/segmented/collapse.js";
	import { segmentedTriggerClass } from "#src/components/segmented/segmented.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		// WHY: picks which rows are listed, with no panel of its own. That's a
		// segmented control, not a tab set.

		// WHY not `AnimatedTabs`: a strip with no tabpanel is a `group` of `aria-pressed`
		// toggles. "Tab 1 of 4" sends a screen reader looking for a panel.

		// WHY `TabDef`: an option and a tab were the same five fields written twice.
		options: readonly TabDef<T>[];
		value: T;
		// For a caller whose value is derived and can't be bound. Same contract as
		// `AnimatedTabs`, so the two are picked by ARIA alone.
		onValueChange?: (value: T) => void;
		// Count per option, keyed by value. Merged over `options[].count`, because
		// the counts usually arrive from the data while the labels are a constant.
		counts?: Partial<Record<T, number>>;
		ariaLabel: string;
		/** Fill the row rather than sit at its natural width. On for the list-page
		 *  filter strip, off for a segment sitting in a toolbar beside others. */
		block?: boolean;
		/** Objects the row may draw before its tail becomes a menu. See `collapse.ts`.
		 *  `"none"` never folds. */
		max?: number | "none";
		/** What the menu segment says. Translate at the call site. */
		moreLabel?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		options,
		value = $bindable(),
		onValueChange,
		counts,
		ariaLabel,
		block = true,
		max = SEGMENT_MAX,
		moreLabel,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================

	// Counts arrive from data, labels are constant. Merged once here, so the pill
	// and the overflow hint say the same thing.
	let merged = $derived(
		options.map((option) => {
			const count = counts?.[option.value] ?? option.count;
			return count === option.count ? option : { ...option, count };
		}),
	);
	let split = $derived(
		splitSegments(
			merged,
			resolveSegmentMax(max),
			merged.findIndex((option) => option.value === value),
		),
	);

	function pick(next: T) {
		value = next;
		onValueChange?.(next);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY scroll, not wrap: it's one object. Past `max` the tail collapses into
     a menu first, so scrolling is the last resort. -->
<div
	class={cn("no-scrollbar flex max-w-full min-w-0 overflow-x-auto", className)}
	role="group"
	aria-label={ariaLabel}
>
	<SegmentedTrack fill={block}>
		{#each split.visible as option (option.value)}
			{@const active = value === option.value}
			<button
				type="button"
				class={segmentedTriggerClass({ fill: block, active })}
				onclick={() => pick(option.value)}
				aria-pressed={active}
			>
				<Segment
					label={option.label}
					count={option.count}
					icon={option.icon}
					image={option.image}
					done={option.done}
					badge={option.badge}
					{active}
				/>
			</button>
		{/each}
		{#snippet after()}
			{#if split.hidden.length > 0}
				<SegmentedOverflow items={split.hidden} onSelect={pick} label={moreLabel} fill={block} />
			{/if}
		{/snippet}
	</SegmentedTrack>
</div>
