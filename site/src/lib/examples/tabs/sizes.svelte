<script lang="ts">
	import * as Tabs from "@heyramzi/ui/shadcn/tabs";

	const sizes = ["sm", "default", "lg"] as const;
</script>

<div class="flex flex-col items-center gap-3">
	{#each sizes as size (size)}
		<Tabs.Root value="week">
			<Tabs.List {size} aria-label="Period, {size}">
				<Tabs.Trigger value="day">Day</Tabs.Trigger>
				<Tabs.Trigger value="week">Week</Tabs.Trigger>
				<Tabs.Trigger value="month">Month</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	{/each}
</div>
