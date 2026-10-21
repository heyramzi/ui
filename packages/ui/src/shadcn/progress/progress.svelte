<script lang="ts">
	import { Progress as ProgressPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import { progressToneClass } from "#src/shadcn/progress/tone.js";
	import type { Tone } from "#src/lib/tone.js";

	let {
		ref = $bindable(null),
		class: className,
		max = 100,
		value,
		tone,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & {
		/** The fill's colour on the severity scale. Left out, the primary colour. */
		tone?: Tone;
	} = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn(
		"bg-muted h-1.5 rounded-full relative flex w-full items-center overflow-x-hidden",
		className,
	)}
	{value}
	{max}
	{...restProps}
>
	<div
		data-slot="progress-indicator"
		class="{progressToneClass(tone)} size-full flex-1 transition-transform duration-[var(--duration-slow)] ease-[var(--ease-smooth-out)] motion-reduce:transition-none"
		style="transform: translateX(-{100 - (100 * (value ?? 0)) / (max ?? 1)}%)"
	></div>
</ProgressPrimitive.Root>
