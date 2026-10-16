<script lang="ts">
// =========================
// IMPORTS
// =========================
import { SegmentedFilter, type TabDef } from "#src/components/segmented/index.js";

// =========================
// TYPES
// =========================
type LocaleOption = {
	value: string;
	label: string;
	flag: string;
};

type Props = {
	// Wraps `SegmentedFilter` so it shares one track with every other strip. It
	// only adds each language's flag.
	value: string;
	onchange: (value: string) => void;
	options?: LocaleOption[];
	/** Names the control for a screen reader. Without it the group is two bare letters. */
	ariaLabel?: string;
	class?: string;
};

// =========================
// PROPS
// =========================
let {
	value,
	onchange,
	options = [
		{ value: "en", label: "EN", flag: "/flags/US.svg" },
		{ value: "fr", label: "FR", flag: "/flags/FR.svg" },
	],
	ariaLabel = "Language",
	class: className,
}: Props = $props();

// =========================
// DERIVED
// =========================
let segments = $derived<TabDef<string>[]>(
	options.map((option) => ({ value: option.value, label: option.label, image: option.flag })),
);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<SegmentedFilter
	{value}
	onValueChange={onchange}
	options={segments}
	block={false}
	{ariaLabel}
	class={className}
/>
