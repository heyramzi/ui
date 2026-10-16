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
	data-slot="attachment-group"
	class={cn(
		"cn-attachment-group flex min-w-0 scroll-fade-x snap-x snap-mandatory scrollbar-none overflow-x-auto overscroll-x-contain *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start gap-3 scroll-px-1 py-1",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
