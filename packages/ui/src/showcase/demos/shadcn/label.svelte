<script lang="ts">
	import { Checkbox } from "#src/shadcn/checkbox/index.js";
	import { Label } from "#src/shadcn/label/index.js";
</script>

<div>
	<div class="flex items-center space-x-2">
		<Checkbox id="terms" />
		<Label for="terms">Accept terms and conditions</Label>
	</div>
</div>
