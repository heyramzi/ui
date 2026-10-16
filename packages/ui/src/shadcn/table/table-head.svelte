<script lang="ts">
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLThAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn(
		"text-muted-foreground h-8 px-2 text-left align-middle text-xs font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</th>
