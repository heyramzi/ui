<script lang="ts">
	import { MagnifyingGlass } from "phosphor-svelte";
	import * as InputGroup from "@heyramzi/ui/shadcn/input-group";
</script>

<InputGroup.Root class="max-w-xs">
	<InputGroup.Input placeholder="Search..." />
	<InputGroup.Addon>
		<MagnifyingGlass aria-hidden="true" />
	</InputGroup.Addon>
	<InputGroup.Addon align="inline-end">12 results</InputGroup.Addon>
</InputGroup.Root>
