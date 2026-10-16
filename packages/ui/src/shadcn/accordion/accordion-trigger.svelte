<script lang="ts">
	import { CaretDown } from "phosphor-svelte";
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@heyramzi/utils";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		indicator,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps["level"];
		/** Replaces the caret, e.g. a plus that turns into a minus. Style it off
		 * `group-aria-expanded/accordion-trigger:`. */
		indicator?: Snippet;
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			"focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-md py-4 text-left text-sm font-medium hover:underline focus-visible:ring-3 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-[color,background-color,border-color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] outline-none disabled:pointer-events-none disabled:opacity-50",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if indicator}
			{@render indicator()}
		{:else}
			<!-- One caret that turns over, not two that swap. A transform and not a
			     `d:` path morph, which is Chromium-only. -->
			<CaretDown
				data-slot="accordion-trigger-icon"
				class="cn-accordion-trigger-icon pointer-events-none shrink-0 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] group-aria-expanded/accordion-trigger:rotate-180 motion-reduce:transition-none"
			/>
		{/if}
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
