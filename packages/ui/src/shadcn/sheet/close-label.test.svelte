<script lang="ts">
	// An open Sheet and Dialog, for the close-label test.
	import * as Sheet from "#src/shadcn/sheet/index.js";
	import * as Dialog from "#src/shadcn/dialog/index.js";

	let { closeLabel }: { closeLabel?: string } = $props();
</script>

<Sheet.Root open>
	<Sheet.Content {closeLabel}>
		<Sheet.Title>Sheet</Sheet.Title>
	</Sheet.Content>
</Sheet.Root>

<Dialog.Root open>
	<Dialog.Content {closeLabel}>
		<Dialog.Title>Dialog</Dialog.Title>
		<Dialog.Footer showCloseButton {closeLabel} />
	</Dialog.Content>
</Dialog.Root>
