<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<main
	bind:this={ref}
	data-slot="sidebar-inset"
	class={cn(
		"bg-background transition-[margin] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] motion-reduce:transition-none lg:peer-data-[variant=inset]:m-2 lg:peer-data-[variant=inset]:ml-0 lg:peer-data-[variant=inset]:rounded-xl lg:peer-data-[variant=inset]:shadow-sm lg:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 relative flex min-h-0 w-full flex-1 flex-col",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</main>
