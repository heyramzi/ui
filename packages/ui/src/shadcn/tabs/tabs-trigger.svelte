<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		// Muted at rest, foreground on hover and when active, so each state reads stronger than rest.
		"data-[state=active]:bg-card data-[state=active]:text-foreground hover:text-foreground focus-visible:shadow-(--ring-focus) focus-visible:data-[state=active]:shadow-(--ring-focus) dark:data-[state=active]:bg-input/30 text-muted-foreground group-data-[pill=on]/tabs-list:data-[state=active]:border-transparent group-data-[pill=on]/tabs-list:data-[state=active]:bg-transparent group-data-[pill=on]/tabs-list:data-[state=active]:shadow-none dark:group-data-[pill=on]/tabs-list:data-[state=active]:bg-transparent relative z-[1] inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--radius-lg)-3px)] border border-transparent px-2 text-sm group-data-[size=sm]/tabs-list:text-[0.8rem] font-medium whitespace-nowrap after:absolute after:top-1/2 after:left-0 after:h-[max(100%,2rem)] after:w-full after:-translate-y-1/2 any-pointer-coarse:after:h-[max(100%,2.75rem)] transition-[color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-btn [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
/>
