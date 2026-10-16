<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import AlertDialogPortal from "#src/shadcn/alert-dialog/alert-dialog-portal.svelte";
	import AlertDialogOverlay from "#src/shadcn/alert-dialog/alert-dialog-overlay.svelte";
	import { cn, type WithoutChild, type WithoutChildrenOrChild } from "@heyramzi/utils";
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
			"t-modal bg-background fixed inset-0 z-50 m-auto grid h-fit w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg",
			className,
		)}
		{...restProps}
	/>
</AlertDialogPortal>
