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
	import { cn, type WithoutChildrenOrChild } from "@heyramzi/utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		side = "right",
		showCloseButton = true,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: Side;
		showCloseButton?: boolean;
		children: Snippet;
	} = $props();

	// Side classes are plain utilities, not `data-[side=x]:` variants. An attribute
	// variant outranks a plain class and tailwind-merge won't dedupe across
	// modifier sets, so a caller's `sm:max-w-xl` lost to the default 384px.
	// Plain utilities let `cn` drop the default when a caller passes its own.
	const SIDE_CLASS: Record<Side, string> = {
		// h-dvh, not h-full: on iOS Safari a fixed panel sizes against the layout
		// viewport, which is taller than the visible area, so h-full hides the footer.
		right: "inset-y-0 right-0 h-dvh w-3/4 border-l sm:max-w-sm",
		left: "inset-y-0 left-0 h-dvh w-3/4 border-r sm:max-w-sm",
		// Full width, capped at 80vh so the overlay stays visible. The safe-area
		// padding keeps the last row clear of the home indicator.
		bottom:
			"inset-x-0 bottom-0 h-auto max-h-[80vh] w-full rounded-t-lg border-t pb-[env(safe-area-inset-bottom)]",
	};
</script>

<SheetPortal {...portalProps}>
	<SheetOverlay />
	<SheetPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		data-side={side}
		class={cn(
			"t-sheet bg-background fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm shadow-overlay",
			SIDE_CLASS[side],
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<SheetPrimitive.Close data-slot="sheet-close">
				{#snippet child({ props })}
					<Button variant="ghost" class="absolute top-3 right-3" size="sm" icon {...props}>
						<X size={16} />
						<span class="sr-only">Close</span>
					</Button>
				{/snippet}
			</SheetPrimitive.Close>
		{/if}
	</SheetPrimitive.Content>
</SheetPortal>
