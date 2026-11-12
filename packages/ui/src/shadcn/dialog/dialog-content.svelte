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
		closeLabel = "Close",
		overlayClass,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		/** What a screen reader calls the built-in close button, in the app's language. */
		closeLabel?: string;
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
		data-close={showCloseButton || undefined}
		class={cn(
			// The popover surface, white on light: `bg-background` is the grey canvas now. The edge
			// and the depth both come from `shadow-edge-overlay`, so no ring draws a second line.
			"t-modal bg-popover text-popover-foreground shadow-edge-overlay fixed z-50 grid w-full gap-4 text-sm outline-none",
			// WHY: on a phone a centered card puts its controls at the top of the reach arc and leaves the on-screen keyboard fighting it for the middle of the screen.

			// Below sm the dialog docks to the bottom edge instead, scrolls inside itself, and clears the home indicator.
			"right-0 bottom-0 left-0 max-h-[88svh] overflow-y-auto overscroll-contain rounded-t-2xl rounded-b-none",
			// One `--dialog-pad` for header, close button and footer. A single `p-` class, since a
			// caller's `p-0` once cancelled only the phone padding of `p-4 sm:p-6`.
			"[--dialog-pad:1rem] sm:[--dialog-pad:1.5rem] p-(--dialog-pad) pb-[max(var(--dialog-pad),env(safe-area-inset-bottom))]",
			"sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:max-h-[calc(100svh-4rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close data-slot="dialog-close">
				{#snippet child({ props })}
					<!-- Centred on the title's 24px line, the glyph's right edge on the content edge:
				     a 32px button sits 4px above and 8px past the padding. -->
					<Button
						variant="ghost"
						class="absolute top-[calc(var(--dialog-pad)-0.25rem)] right-[calc(var(--dialog-pad)-0.5rem)]"
						size="sm"
						icon
						{...props}
					>
						<X aria-hidden="true" size={16} />
						<span class="sr-only">{closeLabel}</span>
					</Button>
				{/snippet}
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPortal>
