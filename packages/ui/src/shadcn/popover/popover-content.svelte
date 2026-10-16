<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import PopoverPortal from "#src/shadcn/popover/popover-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@heyramzi/utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		align = "center",
		// A surface never sits flush against the viewport edge. floating-ui shifts a popover back into view with no gutter of its own,

		// so a picker in a right-hand property column came to rest with its border ON the edge and read as clipped.

		// Eight pixels is the smallest gap that reads as a gap.
		collisionPadding = 8,
		portalProps,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();
</script>

<PopoverPortal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		{sideOffset}
		{align}
		{collisionPadding}
		class={cn(
			"t-dropdown bg-popover text-popover-foreground ring-foreground/10 rounded-xl p-4 text-sm shadow-raised ring-1 z-50 w-72 max-h-[var(--bits-floating-available-height,100svh)] max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain outline-hidden",
			className,
		)}
		{...restProps}
	/>
</PopoverPortal>
