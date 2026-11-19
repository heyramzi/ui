<script lang="ts">
	// A SegmentedFilter inside a toolbar that has run out of room, for the folded-trigger test.
	import { setToolbarDensity } from "#src/components/list-page/toolbar-density.js";
	import SegmentedFilter from "#src/components/segmented/segmented-filter.svelte";

	let {
		options,
		value,
		ariaLabel,
	}: {
		options: { value: string; label: string; count?: number }[];
		value: string;
		ariaLabel: string;
	} = $props();

	setToolbarDensity({ compact: true, tight: false });
</script>

<SegmentedFilter {options} {value} {ariaLabel} />
