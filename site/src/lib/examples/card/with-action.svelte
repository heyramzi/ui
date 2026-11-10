<script lang="ts">
	import { DotsThree } from "phosphor-svelte";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import * as Card from "@heyramzi/ui/shadcn/card";
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title as="h3">Weekly report</Card.Title>
		<Card.Description>Sent every Monday at 9:00 to 4 people.</Card.Description>
		<Card.Action>
			<Button variant="ghost" size="sm" icon aria-label="Report options">
				<DotsThree aria-hidden="true" weight="bold" />
			</Button>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<p class="text-muted-foreground">Next one goes out on 17 Nov.</p>
	</Card.Content>
</Card.Root>
