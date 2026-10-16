<script lang="ts">
	import { Separator } from "#src/shadcn/separator/index.js";
	import { cn } from "@heyramzi/utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-slot="sidebar-separator"
	data-sidebar="separator"
	class={cn("bg-sidebar-border mx-2 w-auto", className)}
	{...restProps}
/>
