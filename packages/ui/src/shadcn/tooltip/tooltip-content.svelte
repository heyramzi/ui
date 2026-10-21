<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";
	import TooltipPortal from "#src/shadcn/tooltip/tooltip-portal.svelte";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 6,
		side = "top",
		children,
		arrowClasses,
		portalProps,
		...restProps
	}: TooltipPrimitive.ContentProps & {
		arrowClasses?: string;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
	} = $props();
</script>

<TooltipPortal {...portalProps}>
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		{sideOffset}
		{side}
		class={cn(
			"t-dropdown z-50 w-fit max-w-xs rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-raised select-none outline-none",
			"has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</TooltipPrimitive.Content>
</TooltipPortal>
