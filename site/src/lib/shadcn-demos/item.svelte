<script lang="ts">
	import { CaretRight, SealCheck } from "phosphor-svelte";
	import * as Item from "@heyramzi/ui/shadcn/item";
	import { Button } from "@heyramzi/ui/shadcn/button";
</script>

<div class="flex w-full max-w-md flex-col gap-6">
	<Item.Root variant="outline">
		<Item.Content>
			<Item.Title>Basic Item</Item.Title>
			<Item.Description>A simple item with title and description.</Item.Description>
		</Item.Content>
		<Item.Actions>
			<Button variant="outline" size="sm">Action</Button>
		</Item.Actions>
	</Item.Root>
	<Item.Root variant="outline" size="sm">
		{#snippet child({ props })}
			<a href="/components/avatar" {...props}>
				<Item.Media>
					<SealCheck aria-hidden="true" class="size-5" />
				</Item.Media>
				<Item.Content>
					<Item.Title>Your profile has been verified.</Item.Title>
				</Item.Content>
				<Item.Actions>
					<CaretRight aria-hidden="true" class="size-4" />
				</Item.Actions>
			</a>
		{/snippet}
	</Item.Root>
</div>
