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
	data-slot="marker-icon"
	aria-hidden="true"
	class={cn("cn-marker-icon shrink-0 size-4 [&_svg:not([class*='size-'])]:size-4", className)}
	{...restProps}
>
	{@render children?.()}
</span>
