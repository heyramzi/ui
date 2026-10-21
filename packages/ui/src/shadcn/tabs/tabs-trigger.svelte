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
		"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground group-data-[pill=on]/tabs-list:data-[state=active]:border-transparent group-data-[pill=on]/tabs-list:data-[state=active]:bg-transparent group-data-[pill=on]/tabs-list:data-[state=active]:shadow-none dark:group-data-[pill=on]/tabs-list:data-[state=active]:bg-transparent relative z-[1] inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 text-sm group-data-[size=sm]/tabs-list:text-[0.8rem] font-medium whitespace-nowrap after:absolute after:top-1/2 after:left-0 after:h-[max(100%,2rem)] after:w-full after:-translate-y-1/2 any-pointer-coarse:after:h-[max(100%,2.75rem)] transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
/>
