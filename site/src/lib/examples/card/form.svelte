<script lang="ts">
	import { Button } from "@heyramzi/ui/shadcn/button";
	import * as Card from "@heyramzi/ui/shadcn/card";
	import * as Field from "@heyramzi/ui/shadcn/field";
	import { Input } from "@heyramzi/ui/shadcn/input";
</script>

<Card.Root class="w-full max-w-sm">
	<Card.Header>
		<Card.Title as="h3">Invite a teammate</Card.Title>
		<Card.Description>They get an email with a link to join.</Card.Description>
	</Card.Header>
	<Card.Content>
		<Field.Field>
			<Field.Label for="example-card-email">Email</Field.Label>
			<Input
				id="example-card-email"
				type="email"
				autocomplete="off"
				placeholder="sam@example.com"
			/>
		</Field.Field>
	</Card.Content>
	<Card.Footer class="justify-end gap-2 border-t">
		<Button variant="ghost">Cancel</Button>
		<Button>Send invite</Button>
	</Card.Footer>
</Card.Root>
