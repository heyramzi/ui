<script lang="ts">
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<kbd
	bind:this={ref}
	data-slot="command-shortcut"
	class={cn(
		"text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</kbd>
