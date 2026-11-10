<script lang="ts">
	import * as Field from "@heyramzi/ui/shadcn/field";
	import { Input } from "@heyramzi/ui/shadcn/input";
</script>

<Field.Field class="max-w-xs">
	<Field.Label for="example-username">Username</Field.Label>
	<Input id="example-username" placeholder="ada" aria-describedby="example-username-hint" />
	<Field.Description id="example-username-hint">It shows on your public profile.</Field.Description>
</Field.Field>
