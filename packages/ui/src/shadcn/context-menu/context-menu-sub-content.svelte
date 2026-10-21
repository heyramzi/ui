<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";
	import ContextMenuPortal from "#src/shadcn/context-menu/context-menu-portal.svelte";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ContextMenuPrimitive.SubContentProps = $props();
</script>

<!-- Portalled: the parent Content scrolls its overflow, so a submenu drawn
     inside it is clipped away, open and invisible. -->
<ContextMenuPortal>
	<ContextMenuPrimitive.SubContent
		bind:ref
		data-slot="context-menu-sub-content"
		class={cn(
			"t-dropdown ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-xl p-1 shadow-raised ring-1 z-50",
			className,
		)}
		{...restProps}
	/>
</ContextMenuPortal>
