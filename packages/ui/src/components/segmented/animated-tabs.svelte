<script lang="ts" module>
	import type { SegmentContent } from "#src/components/segmented/segment.svelte";

	/** One tab. See `SegmentContent` for everything a segment can say. */
	export type TabDef<T extends string = string> = SegmentContent & { value: T };

	/**
	 * Where the tab row sits, the only thing that legitimately differs between
	 * two tab sets. A closed union and not a class string: 23 files each decided
	 * their own.
	 */
	export type TabsPlacement = "toolbar" | "section" | "inline";

	const PLACEMENT_WRAPPER: Record<TabsPlacement, string | undefined> = {
		toolbar: undefined,
		section: "shrink-0 border-b border-border py-2",
		inline: undefined,
	};

	const PLACEMENT_ROOT: Record<TabsPlacement, string | undefined> = {
		toolbar: undefined,
		section: "gap-0",
		inline: "shrink-0",
	};
</script>

<script lang="ts" generics="T extends string">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";
	import Segment from "#src/components/segmented/segment.svelte";
	import SegmentedTrack from "#src/components/segmented/segmented-track.svelte";
	import SegmentedOverflow from "#src/components/segmented/segmented-overflow.svelte";
	import { SEGMENT_MAX, splitSegments } from "#src/components/segmented/collapse.js";
	import { segmentedActiveClass, segmentedTriggerClass } from "#src/components/segmented/segmented.js";

	// WHY re-declare `value` and `onValueChange`: the primitive types them as a
	// bare `string`, so fourteen pages cast back to their union. Generic now, the
	// one narrowing happens here.
	type Props = Omit<TabsPrimitive.RootProps, "value" | "onValueChange"> & {
		tabs: readonly TabDef<T>[];
		value?: T;
		onValueChange?: (value: T) => void;
		// Where the row sits. See `TabsPlacement`.
		placement?: TabsPlacement;
		// WHY: when true the track stretches to its container and triggers share width equally.
		// Use for narrow side panels where pickers should fill the row.
		block?: boolean;
		ariaLabel?: string;
		toolbar?: import("svelte").Snippet;
		// WHY: content ABOVE the tab row but inside the root. A detail pane names the
		// record first, and the row can't leave the root without losing its tabpanel wiring.
		lead?: import("svelte").Snippet;
		// The page's own horizontal gutter, merged over the placement chrome.
		listWrapperClass?: string;
		// WHY: when only one tab is left the pill row is just decoration. Opt in to
		// drop the row entirely (the lone tab's content still renders).
		hideSingle?: boolean;
		// Objects the row may draw before its tail becomes a menu, the menu
		// counted as one of them. See `collapse.ts`.
		max?: number;
		// What the menu segment says. Translate at the call site.
		moreLabel?: string;
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		onValueChange,
		tabs,
		placement = "toolbar",
		block = false,
		ariaLabel,
		toolbar,
		lead,
		class: className,
		listWrapperClass,
		hideSingle = false,
		max = SEGMENT_MAX,
		moreLabel,
		children,
		...restProps
	}: Props = $props();

	let split = $derived(
		splitSegments(
			tabs,
			max,
			tabs.findIndex((tab) => tab.value === value),
		),
	);
</script>

<TabsPrimitive.Root
	bind:ref
	value={value ?? ""}
	onValueChange={(next) => {
		// The single narrowing: bits-ui hands back the string it was given, which
		// is one of `tabs[].value`, so it is a `T`.
		const picked = next as T;
		value = picked;
		onValueChange?.(picked);
	}}
	data-slot="tabs"
	class={cn(
		"group/tabs flex max-w-full min-w-0 flex-col gap-2",
		PLACEMENT_ROOT[placement],
		className,
	)}
	{...restProps}
>
	{@render lead?.()}

	{#if !(hideSingle && tabs.length <= 1)}
		<!-- WHY scroll, not wrap: it's one object. Seven categories ran 828px,
		     past an iPad's edge. Past `max` the tail collapses first. -->
		<div
			class={cn(
				"no-scrollbar flex max-w-full min-w-0 items-center gap-3 overflow-x-auto",
				PLACEMENT_WRAPPER[placement],
				listWrapperClass,
			)}
		>
			<SegmentedTrack fill={block}>
				<!-- WHY an inner `display: contents` tablist: a tablist owns only tabs, and the
				     overflow trigger isn't one. `contents` keeps segments as direct flex children. -->
				<div class="contents" data-slot="tabs-list" role="tablist" aria-label={ariaLabel}>
					{#each split.visible as tab (tab.value)}
						<TabsPrimitive.Trigger
							value={tab.value}
							class={cn(segmentedTriggerClass({ fill: block }), segmentedActiveClass)}
						>
							<Segment
								label={tab.label}
								count={tab.count}
								icon={tab.icon}
								image={tab.image}
								done={tab.done}
								active="auto"
							/>
						</TabsPrimitive.Trigger>
					{/each}
				</div>
				{#snippet after()}
					{#if split.hidden.length > 0}
						<SegmentedOverflow
							items={split.hidden}
							onSelect={(next) => {
								value = next;
								onValueChange?.(next);
							}}
							label={moreLabel}
							fill={block}
						/>
					{/if}
				{/snippet}
			</SegmentedTrack>

			{#if toolbar}
				{@render toolbar()}
			{/if}
		</div>
	{/if}

	{@render children?.()}
</TabsPrimitive.Root>
