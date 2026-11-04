<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import DropdownMenuPortal from "#src/shadcn/dropdown-menu/dropdown-menu-portal.svelte";
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		sideOffset = 4,
		align = "start",
		// Keeps 8px between the menu and the viewport edge, matching the `100vw-1rem` width cap.
		collisionPadding = 8,
		portalProps,
		class: className,
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	} = $props();
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		data-slot="dropdown-menu-content"
		{sideOffset}
		{align}
		{collisionPadding}
		class={cn(
			// 14px around 10px rows inside a 4px inset, so the corners run concentric.
			"t-dropdown bg-popover text-popover-foreground min-w-32 rounded-xl p-1 shadow-edge-raised z-50 w-(--bits-dropdown-menu-anchor-width) max-h-[var(--bits-floating-available-height,100svh)] max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain outline-none data-closed:overflow-hidden",
			className,
		)}
		{...restProps}
	/>
</DropdownMenuPortal>
