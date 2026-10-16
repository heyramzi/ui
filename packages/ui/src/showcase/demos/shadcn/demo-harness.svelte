<script lang="ts">
	// What ShadcnSection puts around a demo, so the test mounts what the page
	// mounts: `input-group` reaches for a tooltip provider it does not create.
	import type { Component } from "svelte";
	import { TooltipProvider } from "#src/shadcn/tooltip/index.js";

	let { Comp }: { Comp: Component } = $props();
</script>

<TooltipProvider>
	<Comp />
</TooltipProvider>
