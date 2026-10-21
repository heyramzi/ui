<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";
	import { slidingPill } from "#src/lib/sliding-pill.js";

	let {
		ref = $bindable(null),
		class: className,
		size = "default",
		children,
		...restProps
	}: TabsPrimitive.ListProps & {
		/** Same steps as Button: sm 28, default 32, lg 36. */
		size?: "sm" | "default" | "lg";
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-size={size}
	class={cn(
		"bg-muted text-muted-foreground group/tabs-list relative inline-flex data-[size=sm]:h-7 data-[size=default]:h-8 data-[size=lg]:h-9 w-fit items-center justify-center rounded-lg p-[3px]",
		className,
	)}
	{...restProps}
>
	<!-- Zero width until the attachment measures, so a server-rendered list
	     shows the trigger's own active background and never an empty pill. -->
	<span
		aria-hidden="true"
		class="bg-background dark:border-input dark:bg-input/30 pointer-events-none absolute inset-y-[3px] left-0 z-0 w-0 rounded-md border border-transparent opacity-0 shadow-sm transition-[transform,width,opacity] duration-[var(--duration-fast,250ms)] ease-[var(--ease-smooth-out,cubic-bezier(0.22,1,0.36,1))] will-change-[transform,width] motion-reduce:transition-opacity"
		{@attach slidingPill}
	></span>
	{@render children?.()}
</TabsPrimitive.List>
