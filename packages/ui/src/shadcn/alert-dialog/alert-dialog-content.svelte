<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import AlertDialogPortal from "#src/shadcn/alert-dialog/alert-dialog-portal.svelte";
	import AlertDialogOverlay from "#src/shadcn/alert-dialog/alert-dialog-overlay.svelte";
	import { cn, type WithoutChild, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
	} = $props();
</script>

<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		data-slot="alert-dialog-content"
		class={cn(
			// The dialog's surface: white popover, the edge and depth from `shadow-edge-overlay`,
			// the overlay radius. `overflow-hidden` lets a banded footer follow the bottom corners.
			"t-modal bg-popover text-popover-foreground shadow-edge-overlay fixed inset-0 z-50 m-auto grid h-fit w-full max-w-[calc(100%-2rem)] gap-4 overflow-hidden rounded-2xl text-sm outline-none sm:max-w-md",
			// Same padding variable as the dialog, so `AlertDialog.Footer band` reads one number.
			"[--dialog-pad:1.25rem] sm:[--dialog-pad:1.5rem] p-(--dialog-pad)",
			className,
		)}
		{...restProps}
	/>
</AlertDialogPortal>
