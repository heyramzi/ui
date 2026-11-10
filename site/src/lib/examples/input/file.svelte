<script lang="ts">
	import * as Field from "@heyramzi/ui/shadcn/field";
	import { Input } from "@heyramzi/ui/shadcn/input";

	let files = $state<FileList>();
</script>

<Field.Field class="max-w-xs">
	<Field.Label for="example-avatar">Avatar</Field.Label>
	<Input id="example-avatar" type="file" accept="image/png, image/jpeg" bind:files />
	<Field.Description>PNG or JPG, up to 2 MB.</Field.Description>
</Field.Field>
