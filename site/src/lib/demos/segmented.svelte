<script lang="ts">
	import { AnimatedTabs, SegmentedFilter } from "@heyramzi/ui/components/segmented";
	import { LANGUAGE_FLAGS } from "@heyramzi/ui/components/language-flag";

	const views = [
		{ value: "board", label: "Board" },
		{ value: "list", label: "List", count: 12 },
		{ value: "timeline", label: "Timeline" },
	];

	let tab = $state("board");
	let rule = $state("board");
	let filter = $state("all");
	let cycle = $state("monthly");
	let language = $state("fr");
</script>

<div class="flex flex-col items-start gap-6">
	<AnimatedTabs tabs={views} bind:value={tab} ariaLabel="View" />
	<!-- The underline variant: bare labels over a hairline, the rule travels. -->
	<AnimatedTabs tabs={views} bind:value={rule} ariaLabel="View" variant="underline" />
	<SegmentedFilter
		options={[
			{ value: "all", label: "All" },
			{ value: "open", label: "Open", count: 4 },
			{ value: "done", label: "Done" },
		]}
		bind:value={filter}
		ariaLabel="Status"
		block={false}
	/>
	<!-- A badge is a short note after the label, such as a saving. -->
	<SegmentedFilter
		options={[
			{ value: "monthly", label: "Monthly" },
			{ value: "yearly", label: "Yearly", badge: "Save 20%" },
		]}
		bind:value={cycle}
		ariaLabel="Billing"
		block={false}
	/>
	<!-- An image draws a flag before each language code. -->
	<SegmentedFilter
		options={[
			{ value: "en", label: "EN", image: LANGUAGE_FLAGS.en },
			{ value: "fr", label: "FR", image: LANGUAGE_FLAGS.fr },
		]}
		bind:value={language}
		ariaLabel="Language"
		block={false}
	/>
</div>
