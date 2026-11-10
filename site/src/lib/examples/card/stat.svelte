<script lang="ts">
	import * as Card from "@heyramzi/ui/shadcn/card";

	const stats = [
		{ label: "Open tasks", value: "18" },
		{ label: "Due this week", value: "6" },
		{ label: "Overdue", value: "2" },
	];
</script>

<div class="grid w-full max-w-md grid-cols-3 gap-3">
	{#each stats as stat (stat.label)}
		<Card.Root size="sm">
			<Card.Header>
				<Card.Description>{stat.label}</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-2xl font-semibold tabular-nums">{stat.value}</p>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
