<script lang="ts">
	import * as Select from "@heyramzi/ui/shadcn/select";

	const zones = [
		{
			region: "Europe",
			items: [
				{ value: "europe/lisbon", label: "Lisbon" },
				{ value: "europe/paris", label: "Paris" },
				{ value: "europe/berlin", label: "Berlin" },
			],
		},
		{
			region: "Americas",
			items: [
				{ value: "america/new_york", label: "New York" },
				{ value: "america/chicago", label: "Chicago" },
				{ value: "america/los_angeles", label: "Los Angeles" },
			],
		},
	];
	const items = zones.flatMap((zone) => zone.items);

	let value = $state("");
</script>

<Select.Root type="single" {items} bind:value>
	<Select.Trigger class="w-[200px]">
		{items.find((item) => item.value === value)?.label ?? "Pick a time zone"}
	</Select.Trigger>
	<Select.Content>
		{#each zones as zone, i (zone.region)}
			{#if i}<Select.Separator />{/if}
			<Select.Group>
				<Select.GroupHeading>{zone.region}</Select.GroupHeading>
				{#each zone.items as item (item.value)}
					<Select.Item value={item.value} label={item.label} />
				{/each}
			</Select.Group>
		{/each}
	</Select.Content>
</Select.Root>
