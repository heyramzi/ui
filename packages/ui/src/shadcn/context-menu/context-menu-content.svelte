<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";
	import ContextMenuPortal from "#src/shadcn/context-menu/context-menu-portal.svelte";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		portalProps,
		class: className,
		...restProps
	}: ContextMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof ContextMenuPortal>>;
	} = $props();
</script>

<ContextMenuPortal {...portalProps}>
	<ContextMenuPrimitive.Content
		bind:ref
		data-slot="context-menu-content"
		class={cn(
			"t-dropdown ring-foreground/10 bg-popover text-popover-foreground min-w-36 rounded-xl p-1 shadow-raised ring-1 z-50 overflow-x-hidden overflow-y-auto outline-none",
			className,
		)}
		{...restProps}
	/>
</ContextMenuPortal>
