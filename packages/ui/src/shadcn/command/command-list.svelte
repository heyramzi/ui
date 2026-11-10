<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	class={cn(
		"scrollbar-thin max-h-[420px] scroll-py-1 outline-none overflow-x-hidden overflow-y-auto px-1.5 py-1",
		className,
	)}
	{...restProps}
>
	<!-- Bits points the input's required aria-controls at the viewport, so without one the combobox has none. -->
	<CommandPrimitive.Viewport>
		{@render children?.()}
	</CommandPrimitive.Viewport>
</CommandPrimitive.List>
