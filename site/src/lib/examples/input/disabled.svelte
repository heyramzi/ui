<script lang="ts">
	import * as Field from "@heyramzi/ui/shadcn/field";
	import { Input } from "@heyramzi/ui/shadcn/input";
</script>

<Field.Field class="max-w-xs" data-disabled="true">
	<Field.Label for="example-workspace">Workspace</Field.Label>
	<Input id="example-workspace" value="acme-studio" disabled />
</Field.Field>
