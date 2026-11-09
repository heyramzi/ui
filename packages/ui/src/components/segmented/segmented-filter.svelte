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
	import { Mark } from "#src/components/mark/index.js";
	import { CaretDown } from "phosphor-svelte";
	import { Picker } from "#src/components/picker/index.js";
	import { toolbarTriggerClass } from "#src/components/toolbar/toolbar-trigger.js";
	import { getToolbarDensity } from "#src/components/list-page/toolbar-density.js";

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
		/** An option with an `image` or `icon` draws the mark alone, and its label
		 *  moves to `aria-label` and the hover title. For a toolbar with no room
		 *  for words, where every mark is a brand people know. */
		iconOnly?: boolean;
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
		iconOnly = false,
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

	// Inside a list-page toolbar that ran out of room, the strip folds into one
	// dropdown that names the current option. See `ListPageShell`.
	const density = getToolbarDensity();
	let folded = $derived(density?.compact === true);
	let current = $derived(merged.find((option) => option.value === value) ?? merged[0]);
	let pickerOptions = $derived(
		merged.map((option) => ({
			value: option.value,
			label: option.label,
			hint: option.count != null ? String(option.count) : undefined,
			icon: option.icon,
		})),
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
{#if folded && current}
	<Picker
		options={pickerOptions}
		{value}
		onSelect={pick}
		triggerClass={toolbarTriggerClass({ className: "group/segment text-foreground" })}
		triggerLabel={`${ariaLabel}: ${current.label}`}
		align="end"
	>
		{#snippet trigger()}
			<Segment label={current.label} count={current.count} icon={current.icon} active />
			<CaretDown
				class="size-3 shrink-0 opacity-60 transition-transform duration-150 group-data-[state=open]/segment:rotate-180"
			/>
		{/snippet}
	</Picker>
{:else}
	<div
		class={cn("no-scrollbar flex max-w-full min-w-0 overflow-x-auto", className)}
		role="group"
		aria-label={ariaLabel}
	>
		<SegmentedTrack fill={block}>
			{#each split.visible as option (option.value)}
				{@const active = value === option.value}
				{@const markOnly = iconOnly && Boolean(option.image || option.icon)}
				<button
					type="button"
					class={segmentedTriggerClass({ fill: block, active })}
					onclick={() => pick(option.value)}
					aria-pressed={active}
					aria-label={markOnly ? option.label : undefined}
					title={markOnly ? option.label : undefined}
				>
					<!-- WHY the mark is drawn here, not by `Segment`: `Segment` always
				     writes the label, and a count or dot beside a bare mark reads as noise. -->
					{#if markOnly && option.image}
						<Mark
							src={option.image}
							label={option.label}
							class={cn(
								"opacity-75 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-hover/segment:opacity-100",
								active && "opacity-100",
							)}
						/>
					{:else if markOnly && option.icon}
						<option.icon size={16} class="shrink-0" />
					{:else}
						<Segment
							label={option.label}
							count={option.count}
							icon={option.icon}
							image={option.image}
							done={option.done}
							badge={option.badge}
							{active}
						/>
					{/if}
				</button>
			{/each}
			{#snippet after()}
				{#if split.hidden.length > 0}
					<SegmentedOverflow items={split.hidden} onSelect={pick} label={moreLabel} fill={block} />
				{/if}
			{/snippet}
		</SegmentedTrack>
	</div>
{/if}
