<script lang="ts">
	import { Button } from "@heyramzi/ui/shadcn/button";
	import * as Tabs from "@heyramzi/ui/shadcn/tabs";

	const steps = ["details", "review", "confirm"];

	let value = $state("details");
	const last = $derived(steps.indexOf(value) === steps.length - 1);
</script>

<div class="flex w-full max-w-sm flex-col gap-3">
	<Tabs.Root bind:value>
		<Tabs.List>
			<Tabs.Trigger value="details">Details</Tabs.Trigger>
			<Tabs.Trigger value="review">Review</Tabs.Trigger>
			<Tabs.Trigger value="confirm">Confirm</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="details" class="text-muted-foreground text-sm"
			>Name the project and pick a client.</Tabs.Content
		>
		<Tabs.Content value="review" class="text-muted-foreground text-sm"
			>Check the budget and the dates.</Tabs.Content
		>
		<Tabs.Content value="confirm" class="text-muted-foreground text-sm"
			>Send it to the client to sign.</Tabs.Content
		>
	</Tabs.Root>
	<Button
		variant="outline"
		class="self-start"
		disabled={last}
		onclick={() => (value = steps[steps.indexOf(value) + 1] ?? value)}
	>
		Next step
	</Button>
</div>
