<script lang="ts">
	import { Plus } from "phosphor-svelte";
	import { Button } from "@heyramzi/ui/shadcn/button";
</script>

<div class="flex flex-col items-center gap-4">
	<div class="flex flex-wrap items-center justify-center gap-2">
		<Button variant="outline" size="sm">Small</Button>
		<Button variant="outline">Default</Button>
		<Button variant="outline" size="lg">Large</Button>
	</div>
	<div class="flex flex-wrap items-center justify-center gap-2">
		<Button variant="outline" size="sm" icon aria-label="Add"><Plus /></Button>
		<Button variant="outline" icon aria-label="Add"><Plus /></Button>
		<Button variant="outline" size="lg" icon aria-label="Add"><Plus /></Button>
	</div>
</div>
