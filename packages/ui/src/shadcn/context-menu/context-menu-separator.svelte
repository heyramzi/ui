<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ContextMenuPrimitive.SeparatorProps = $props();
</script>

<ContextMenuPrimitive.Separator
	bind:ref
	data-slot="context-menu-separator"
	class={cn(
		"bg-border -mx-1 my-1 h-px first:hidden last:hidden [[data-slot=context-menu-separator]+&]:hidden",
		className,
	)}
	{...restProps}
/>
