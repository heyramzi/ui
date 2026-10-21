<script lang="ts">
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLTdAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn("p-2 align-middle whitespace-nowrap tabular-nums [&:has([role=checkbox])]:pr-0", className)}
	{...restProps}
>
	{@render children?.()}
</td>

<!-- WHY here: a link in a cell is 20px tall, and a cell is the only place that knows it sits in a
     row of them. On a coarse pointer the link grows a 44px box centred on it, wider when the link
     is. A link that positions itself (a stretched row link) keeps its own box. -->
<style>
	@media (any-pointer: coarse) {
		td :global(a[href]:not([class*="absolute"], [class*="fixed"], [class*="sticky"])) {
			position: relative;
		}
		td :global(a[href]:not([class*="absolute"], [class*="fixed"], [class*="sticky"]))::after {
			content: "";
			position: absolute;
			top: 50%;
			left: 50%;
			width: max(100%, 2.75rem);
			height: max(100%, 2.75rem);
			transform: translate(-50%, -50%);
		}
	}
</style>
