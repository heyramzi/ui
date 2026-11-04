<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { Button } from "#src/shadcn/button/index.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		showCloseButton = false,
		band = false,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		showCloseButton?: boolean;
		/**
		 * Draw the footer as a band: a hairline on top and a quiet surface out to both edges
		 * and the bottom corners. It cancels the content's `--dialog-pad` with a negative
		 * margin, so it only works as the content's last child. A bare `data-band` attribute
		 * does the same, for callers on a release that predates this prop.
		 */
		band?: boolean;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="dialog-footer"
	data-band={band || undefined}
	class={cn(
		"flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end",
		// The band. The bottom margin matches the content's bottom padding, safe area included,
		// so the surface reaches the edge on a phone docked over the home indicator too.
		"data-band:border-border data-band:bg-muted/50 data-band:mt-2 data-band:border-t",
		"data-band:mx-[calc(-1*var(--dialog-pad))] data-band:px-(--dialog-pad) data-band:py-4",
		"data-band:mb-[calc(-1*max(var(--dialog-pad),env(safe-area-inset-bottom)))]",
		"data-band:pb-[max(1rem,env(safe-area-inset-bottom))] sm:data-band:pb-4",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	{#if showCloseButton}
		<DialogPrimitive.Close>
			{#snippet child({ props })}
				<Button variant="outline" {...props}>Close</Button>
			{/snippet}
		</DialogPrimitive.Close>
	{/if}
</div>
