<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { menuItemClass } from "#src/shadcn/dropdown-menu/menu-item.js";
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		variant = "default",
		...restProps
	}: DropdownMenuPrimitive.ItemProps & {
		inset?: boolean;
		variant?: "default" | "destructive";
	} = $props();
</script>

<DropdownMenuPrimitive.Item
	bind:ref
	data-slot="dropdown-menu-item"
	data-inset={inset}
	data-variant={variant}
	class={cn(
		"group/dropdown-menu-item",
		menuItemClass({ variant, inset: inset ? true : false }),
		className,
	)}
	{...restProps}
/>
