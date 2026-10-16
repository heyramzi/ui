<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { cn, type WithoutChild } from "$UTILS$.js";

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps["level"];
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			"focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-md py-4 text-left text-sm font-medium hover:underline focus-visible:ring-3 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<IconPlaceholder
			lucide="ChevronDownIcon"
			tabler="IconChevronDown"
			data-slot="accordion-trigger-icon"
			hugeicons="ArrowDown01Icon"
			phosphor="CaretDownIcon"
			remixicon="RiArrowDownSLine"
			class="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
		/>
		<IconPlaceholder
			lucide="ChevronUpIcon"
			tabler="IconChevronUp"
			data-slot="accordion-trigger-icon"
			hugeicons="ArrowUp01Icon"
			phosphor="CaretUpIcon"
			remixicon="RiArrowUpSLine"
			class="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
		/>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
