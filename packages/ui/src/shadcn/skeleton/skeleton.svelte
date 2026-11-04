<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	class={cn(
		// A foreground wash on light, because `bg-muted` (L 0.94) vanished on the 0.945 canvas.
		"bg-foreground/6 dark:bg-muted rounded-sm animate-pulse motion-reduce:animate-none",
		className,
	)}
	{...restProps}
></div>
