<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		value = $bindable(),
		valueText,
		thumbLabel,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
		/** Announced in place of the raw value, for a slider running on stop indices. */
		valueText?: string;
		/** Names the thumb, which is the element carrying `role="slider"`. */
		thumbLabel?: string;
	} = $props();
</script>

<!-- WHY currentColor: the track fill and the thumb ring are one accent, so a surface
     that needs a different one sets `text-*` on the root once. -->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	class={cn(
		"text-primary relative flex w-full touch-none items-center py-2 select-none data-disabled:pointer-events-none data-disabled:opacity-50",
		className,
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			class="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full"
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class="absolute h-full rounded-full bg-current"
			/>
		</span>
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				index={thumb.index}
				data-slot="slider-thumb"
				aria-label={thumbLabel}
				aria-valuetext={valueText}
				class="bg-background focus-visible:ring-ring/50 block size-5 cursor-grab rounded-full border-2 border-current shadow-[var(--elev-btn)] transition-[transform,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] outline-none hover:scale-110 focus-visible:ring-3 active:cursor-grabbing data-active:scale-110 data-active:shadow-[var(--elev-raised)] pointer-coarse:size-6 after:absolute after:top-1/2 after:left-1/2 after:size-8 after:-translate-x-1/2 after:-translate-y-1/2 any-pointer-coarse:after:size-11"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
