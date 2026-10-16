<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DropdownMenuPrimitive.SubContentProps = $props();
</script>

<DropdownMenuPrimitive.SubContent
	bind:ref
	data-slot="dropdown-menu-sub-content"
	class={cn(
		"t-dropdown ring-foreground/10 bg-popover text-popover-foreground min-w-[96px] rounded-xl p-1 shadow-raised ring-1 z-50 w-auto",
		className,
	)}
	{...restProps}
/>
