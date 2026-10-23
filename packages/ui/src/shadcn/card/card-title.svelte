<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "#src/lib/utils.js";

	// WHY: card titles default to a div, so pass `as="h2"` on real section titles or a page of cards has no headings for screen readers (WCAG 2.4.6).
	let {
		ref = $bindable(null),
		class: className,
		as = "div",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> & {
		as?: "div" | "h2" | "h3" | "h4" | "h5" | "h6";
	} = $props();
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="card-title"
	class={cn("text-base leading-normal font-medium group-data-[size=sm]/card:text-sm", className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
