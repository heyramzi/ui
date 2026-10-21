<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "#src/lib/utils.js";
	import { CaretDown } from "phosphor-svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		"border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-md border bg-transparent py-1 pr-2 pl-2.5 text-sm shadow-xs transition-[color,box-shadow] focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:text-[0.8rem] relative data-[size=sm]:after:absolute data-[size=sm]:after:top-1/2 data-[size=sm]:after:left-0 data-[size=sm]:after:h-[max(100%,2rem)] data-[size=sm]:after:w-full data-[size=sm]:after:-translate-y-1/2 *:data-[slot=select-value]:flex *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	<!-- Turns over while the list is open, so the trigger says which way it goes. -->
	<CaretDown
		size={16}
		class="text-muted-foreground pointer-events-none transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] in-data-[state=open]:rotate-180 motion-reduce:transition-none"
	/>
</SelectPrimitive.Trigger>
