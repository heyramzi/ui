<script lang="ts">
	import * as Field from "@heyramzi/ui/shadcn/field";
	import { Input } from "@heyramzi/ui/shadcn/input";
</script>

<Field.Field class="max-w-xs" data-invalid="true">
	<Field.Label for="example-email">Email</Field.Label>
	<Input
		id="example-email"
		type="email"
		autocomplete="email"
		value="ada@"
		aria-invalid="true"
		aria-describedby="example-email-error"
	/>
	<Field.Error id="example-email-error">Add the part after the @.</Field.Error>
</Field.Field>
