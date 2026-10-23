<script lang="ts">
	import * as Dialog from "@heyramzi/ui/shadcn/dialog";
	import { Button, buttonVariants } from "@heyramzi/ui/shadcn/button";
	import { Input } from "@heyramzi/ui/shadcn/input";
	import { Label } from "@heyramzi/ui/shadcn/label";
</script>

<Dialog.Root>
	<form>
		<Dialog.Trigger type="button" class={buttonVariants({ variant: "outline" })}>
			Edit profile
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Edit profile</Dialog.Title>
				<Dialog.Description>Change the name shown on reports. Save when done.</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4">
				<div class="grid gap-3">
					<Label for="name-1">Name</Label>
					<Input id="name-1" name="name" defaultValue="Alex Morgan" />
				</div>
				<div class="grid gap-3">
					<Label for="username-1">Handle</Label>
					<Input id="username-1" name="username" defaultValue="@alex" />
				</div>
			</div>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}>
					Cancel
				</Dialog.Close>
				<Button type="submit">Save changes</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</form>
</Dialog.Root>
