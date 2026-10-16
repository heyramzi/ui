<script lang="ts">
	import { ArrowUp } from "phosphor-svelte";
	import { Button } from "@heyramzi/ui/shadcn/button";
</script>

<div class="flex flex-wrap items-center gap-2 md:flex-row">
	<Button variant="outline">Button</Button>
	<Button variant="outline" icon aria-label="Submit">
		<ArrowUp />
	</Button>
</div>
