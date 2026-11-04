<script lang="ts">
	import * as Dialog from "@heyramzi/ui/shadcn/dialog";
	import * as AlertDialog from "@heyramzi/ui/shadcn/alert-dialog";
	import * as Sheet from "@heyramzi/ui/shadcn/sheet";
	import { Button, buttonVariants } from "@heyramzi/ui/shadcn/button";
	import { Input } from "@heyramzi/ui/shadcn/input";
	import { Label } from "@heyramzi/ui/shadcn/label";
	import { SegmentedFilter } from "@heyramzi/ui/components/segmented";

	let language = $state<"en" | "fr">("en");
	const languages = [
		{ value: "en", label: "EN" },
		{ value: "fr", label: "FR" },
	] as const;
</script>

<div class="flex flex-wrap gap-2">
	<!-- A form dialog: header, body and a banded footer, padded once by the content. -->
	<Dialog.Root>
		<Dialog.Trigger class={buttonVariants({ variant: "outline" })}>Add project</Dialog.Trigger>
		<Dialog.Content>
			<form class="contents" onsubmit={(e) => e.preventDefault()}>
				<Dialog.Header>
					<Dialog.Title>Add project</Dialog.Title>
				</Dialog.Header>
				<Dialog.Body>
					<div class="grid gap-2">
						<Label for="demo-task">ClickUp task</Label>
						<Input id="demo-task" placeholder="Paste a task link or ID" />
					</div>
					<div class="grid gap-2">
						<Label for="demo-company">Company</Label>
						<Input id="demo-company" placeholder="Acme Corp" />
					</div>
					<div class="flex items-center justify-between">
						<Label>Language</Label>
						<SegmentedFilter
							options={languages}
							bind:value={language}
							ariaLabel="Language"
							block={false}
						/>
					</div>
				</Dialog.Body>
				<Dialog.Footer band>
					<Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}>
						Cancel
					</Dialog.Close>
					<Button type="submit">Add project</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- A confirm: the same parts, the band holding the two answers. -->
	<AlertDialog.Root>
		<AlertDialog.Trigger class={buttonVariants({ variant: "outline" })}>
			Delete project
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Acme Corp?</AlertDialog.Title>
				<AlertDialog.Description>
					Its tasks, invoices and files go with it. You can't undo this.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer band>
				<AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
				<AlertDialog.Action class={buttonVariants({ variant: "destructive" })}
					>Delete project</AlertDialog.Action
				>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<!-- A sheet: header, a body that scrolls, and the band pinned to the bottom. -->
	<Sheet.Root>
		<Sheet.Trigger class={buttonVariants({ variant: "outline" })}>Edit client</Sheet.Trigger>
		<Sheet.Content side="right">
			<Sheet.Header>
				<Sheet.Title>Edit client</Sheet.Title>
				<Sheet.Description>Shown on invoices and the portal.</Sheet.Description>
			</Sheet.Header>
			<Sheet.Body>
				<div class="grid gap-2">
					<Label for="demo-client">Name</Label>
					<Input id="demo-client" value="Acme Corp" />
				</div>
				<div class="grid gap-2">
					<Label for="demo-email">Billing email</Label>
					<Input id="demo-email" value="billing@acme.example" />
				</div>
			</Sheet.Body>
			<Sheet.Footer band>
				<Sheet.Close class={buttonVariants({ variant: "outline" })}>Cancel</Sheet.Close>
				<Button>Save</Button>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>
</div>
