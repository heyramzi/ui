<script lang="ts">
	import * as Select from "@heyramzi/ui/shadcn/select";

	const themes = [
		{ value: "ink", label: "Ink" },
		{ value: "paper", label: "Paper" },
		{ value: "auto", label: "System" },
	];

	let value = $state("ink");
	let label = $derived(themes.find((t) => t.value === value)?.label ?? "Pick a theme");
</script>

<Select.Root type="single" name="theme" bind:value>
	<Select.Trigger class="w-45">
		{label}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.Label>Theme</Select.Label>
			{#each themes as theme (theme.value)}
				<Select.Item value={theme.value} label={theme.label}>
					{theme.label}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
