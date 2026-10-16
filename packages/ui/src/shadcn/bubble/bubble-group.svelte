<script lang="ts">
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="bubble-group"
	class={cn("cn-bubble-group flex min-w-0 flex-col gap-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>
