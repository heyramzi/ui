<script lang="ts" module>
	// Sheets slide in from the left, right or bottom. `top` never had a caller.
	export type Side = "left" | "right" | "bottom";
</script>

<script lang="ts">
	import "#src/shadcn/sheet/sheet.css";
	import { Dialog as SheetPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import SheetPortal from "#src/shadcn/sheet/sheet-portal.svelte";
	import SheetOverlay from "#src/shadcn/sheet/sheet-overlay.svelte";
	import { Button } from "#src/shadcn/button/index.js";
	import { X } from "phosphor-svelte";
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		side = "right",
		showCloseButton = true,
		floating,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: Side;
		showCloseButton?: boolean;
		/**
		 * From `sm` up a left or right sheet floats 8px off the edge, like SidePanel;
		 * `floating={false}` keeps it flush. A phone stays full bleed for the width.
		 */
		floating?: boolean;
		children: Snippet;
	} = $props();

	// Side sheets float unless a caller opts out; a bottom sheet stays docked.
	const floats = $derived(floating ?? side !== "bottom");

	// Plain side utilities, not `data-[side=x]:` variants, because the variant outranks a
	// caller's `sm:max-w-xl` and tailwind-merge can't dedupe across modifier sets.
	const SIDE_CLASS: Record<Side, string> = {
		// h-dvh: on iOS Safari h-full sizes a fixed panel to the taller layout viewport and
		// hides the footer. `shadow-edge-overlay` draws the hairline, so no side border.
		right: "inset-y-0 right-0 h-dvh w-3/4 sm:max-w-sm",
		left: "inset-y-0 left-0 h-dvh w-3/4 sm:max-w-sm",
		// Full width, capped at 80vh so the overlay stays visible. The safe-area
		// padding keeps the last row clear of the home indicator.
		bottom:
			"inset-x-0 bottom-0 h-auto max-h-[80vh] w-full rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
	};

	// Floating: an 8px inset (`2`) on the sheet's own sides, the height cut by both gutters,
	// and the overlay radius on every corner (DESIGN.md rule 2).
	const FLOATING_CLASS: Record<Side, string> = {
		right: "sm:inset-y-2 sm:right-2 sm:h-[calc(100dvh-1rem)] sm:rounded-2xl",
		left: "sm:inset-y-2 sm:left-2 sm:h-[calc(100dvh-1rem)] sm:rounded-2xl",
		bottom: "sm:inset-x-2 sm:bottom-2 sm:w-[calc(100%-1rem)] sm:rounded-2xl",
	};
</script>

<SheetPortal {...portalProps}>
	<SheetOverlay />
	<SheetPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		data-side={side}
		data-floating={floats || undefined}
		data-close={showCloseButton || undefined}
		class={cn(
			"t-sheet bg-popover text-popover-foreground fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-edge-overlay",
			SIDE_CLASS[side],
			floats && FLOATING_CLASS[side],
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<SheetPrimitive.Close data-slot="sheet-close">
				{#snippet child({ props })}
					<Button variant="ghost" class="absolute top-3 right-2" size="sm" icon {...props}>
						<X aria-hidden="true" size={16} />
						<span class="sr-only">Close</span>
					</Button>
				{/snippet}
			</SheetPrimitive.Close>
		{/if}
	</SheetPrimitive.Content>
</SheetPortal>
