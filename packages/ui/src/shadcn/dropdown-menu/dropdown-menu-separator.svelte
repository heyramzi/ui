<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.SeparatorProps = $props();
</script>

<DropdownMenuPrimitive.Separator
	bind:ref
	data-slot="dropdown-menu-separator"
	class={cn(
		"bg-border -mx-1 my-1 h-px first:hidden last:hidden [[data-slot=dropdown-menu-separator]+&]:hidden",
		className,
	)}
	{...restProps}
/>
