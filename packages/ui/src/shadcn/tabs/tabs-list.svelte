<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		size = "default",
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
		"bg-muted text-muted-foreground group/tabs-list inline-flex data-[size=sm]:h-7 data-[size=default]:h-8 data-[size=lg]:h-9 w-fit items-center justify-center rounded-lg p-[3px]",
		className,
	)}
	{...restProps}
/>
