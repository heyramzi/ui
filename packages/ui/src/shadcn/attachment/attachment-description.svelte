<script lang="ts">
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	data-slot="attachment-description"
	class={cn(
		"cn-attachment-description block min-w-0 truncate text-muted-foreground group-data-[state=error]/attachment:text-destructive/80 max-w-full mt-0.5 text-xs",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</span>
