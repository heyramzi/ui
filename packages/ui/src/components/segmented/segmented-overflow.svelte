<script lang="ts" generics="V extends string">
// =========================
// IMPORTS
// =========================
import { CaretDown } from "phosphor-svelte";
import { Picker } from "#src/components/picker/index.js";
import { cn } from "@heyramzi/utils";
import { segmentedTriggerClass } from "#src/components/segmented/segmented.js";
import type { SegmentContent } from "#src/components/segmented/segment.svelte";

// =========================
// TYPES
// =========================
/** The last object in an overfull strip: one segment that opens the rest. */

// WHY the `Picker`: every "pick one of these" goes there, so keys and
// filtering match the command palette.

// WHY never active: `splitSegments` pulls the current item into a visible slot,
// so this never fights bits-ui's `data-state="open"`.
type Props = {
	items: readonly (SegmentContent & { value: V })[];
	onSelect: (value: V) => void;
	/** What the segment says. Translate at the call site. */
	label?: string;
	fill?: boolean;
	searchPlaceholder?: string;
	emptyLabel?: string;
};

// =========================
// PROPS
// =========================
let {
	items,
	onSelect,
	label = "More",
	fill = false,
	searchPlaceholder,
	emptyLabel,
}: Props = $props();

// =========================
// DERIVED
// =========================

// A count rides as the row's hint, where the strip draws it as a pill.
let options = $derived(
	items.map((item) => ({
		value: item.value,
		label: item.label,
		hint: item.count != null ? String(item.count) : undefined,
		icon: item.icon,
	})),
);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Picker
	{options}
	value={null}
	onSelect={(value) => onSelect(value)}
	triggerClass={cn(
		segmentedTriggerClass({ fill }),
		"data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground",
	)}
	triggerLabel={label}
	align="end"
	{searchPlaceholder}
	{emptyLabel}
>
	{#snippet trigger()}
		{label}
		<CaretDown
			class={cn(
				"shrink-0 transition-transform duration-150 group-data-[state=open]/segment:rotate-180",
				"size-3.5",
			)}
		/>
	{/snippet}
</Picker>
