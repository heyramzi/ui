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
	data-slot="message-avatar"
	class={cn(
		"cn-message-avatar flex w-fit shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted min-w-8 group-has-data-[slot=message-footer]/message:-translate-y-8",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
