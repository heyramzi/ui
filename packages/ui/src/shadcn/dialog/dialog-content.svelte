<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import DialogPortal from "#src/shadcn/dialog/dialog-portal.svelte";
	import DialogOverlay from "#src/shadcn/dialog/dialog-overlay.svelte";
	import type { Snippet } from "svelte";
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import { X } from "phosphor-svelte";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showCloseButton = true,
		overlayClass,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		/** Classes for the backdrop this dialog mounts, which is its sibling in the
		 *  portal and so cannot be reached from the content's own class. */
		overlayClass?: string;
	} = $props();
</script>

<DialogPortal {...portalProps}>
	<DialogOverlay class={overlayClass} />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(
			"t-modal bg-background ring-foreground/10 shadow-overlay fixed z-50 grid w-full gap-4 text-sm ring-1 outline-none",
			// WHY: on a phone a centered card puts its controls at the top of the reach arc and leaves the on-screen keyboard fighting it for the middle of the screen.

			// Below sm the dialog docks to the bottom edge instead, scrolls inside itself, and clears the home indicator.
			"right-0 bottom-0 left-0 max-h-[88svh] overflow-y-auto overscroll-contain rounded-t-xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
			"sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100svh-4rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close data-slot="dialog-close">
				{#snippet child({ props })}
					<Button variant="ghost" class="absolute top-4 right-4" size="sm" icon {...props}>
						<X size={16} />
						<span class="sr-only">Close</span>
					</Button>
				{/snippet}
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPortal>
