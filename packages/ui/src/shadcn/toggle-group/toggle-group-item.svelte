<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { getToggleGroupCtx } from "#src/shadcn/toggle-group/toggle-group.svelte";
	import { cn } from "@heyramzi/utils";
	import { type ToggleVariants, toggleVariants } from "#src/shadcn/toggle/index.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size,
		variant,
		...restProps
	}: ToggleGroupPrimitive.ItemProps & ToggleVariants = $props();

	const ctx = getToggleGroupCtx();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	data-variant={ctx.variant || variant}
	data-size={ctx.size || size}
	data-spacing={ctx.spacing}
	class={cn(
		toggleVariants({
			variant: ctx.variant || variant,
			size: ctx.size || size,
		}),
		"w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10 data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-s-md data-[spacing=0]:last:rounded-e-md data-[spacing=0]:data-[variant=outline]:border-s-0 data-[spacing=0]:data-[variant=outline]:first:border-s",
		className,
	)}
	{value}
	{...restProps}
/>
