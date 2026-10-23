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

	// WHY clamped: a value past max drew a positive translateX and the fill left its track.
	let pct = $derived.by(() => {
		const top = max && max > 0 ? max : 1;
		const raw = (100 * (value ?? 0)) / top;
		return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
	});
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
		style="transform: translateX(-{100 - pct}%)"
	></div>
</ProgressPrimitive.Root>
