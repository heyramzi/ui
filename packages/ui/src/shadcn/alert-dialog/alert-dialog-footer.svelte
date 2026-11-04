<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		band = false,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** A hairline and a quiet surface out to both edges and the bottom corners. Last child only. */
		band?: boolean;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert-dialog-footer"
	data-band={band || undefined}
	class={cn(
		"flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
		"data-band:border-border data-band:bg-muted/50 data-band:mt-2 data-band:border-t",
		"data-band:mx-[calc(-1*var(--dialog-pad))] data-band:mb-[calc(-1*var(--dialog-pad))] data-band:px-(--dialog-pad) data-band:py-4",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
