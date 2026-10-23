<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLTdAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		wrap = false,
		children,
		...restProps
	}: WithElementRef<HTMLTdAttributes> & {
		/** Lets a long user string wrap, so a trailing action cell keeps its place. Off by default: amounts and dates stay on one line. */
		wrap?: boolean;
	} = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn(
		"p-2 align-middle tabular-nums [&:has([role=checkbox])]:pr-0",
		wrap ? "whitespace-normal [overflow-wrap:anywhere]" : "whitespace-nowrap",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</td>

<!-- A cell's link is 20px tall, so on a coarse pointer it grows a 44px hit box here, unless it
     positions itself, like a stretched row link. -->
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
