<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import SelectPortal from "#src/shadcn/select/select-portal.svelte";
	import SelectScrollUpButton from "#src/shadcn/select/select-scroll-up-button.svelte";
	import SelectScrollDownButton from "#src/shadcn/select/select-scroll-down-button.svelte";
	import { cn, type WithoutChild } from "#src/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		// 8px between the list and the viewport edge, as the dropdown and popover keep.
		collisionPadding = 8,
		portalProps,
		children,
		preventScroll = true,
		...restProps
	}: WithoutChild<SelectPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SelectPortal>>;
	} = $props();
</script>

<SelectPortal {...portalProps}>
	<SelectPrimitive.Content
		bind:ref
		{sideOffset}
		{collisionPadding}
		{preventScroll}
		data-slot="select-content"
		class={cn(
			// 14px around 10px rows inside a 4px inset, so the corners run concentric.
			"t-dropdown bg-popover text-popover-foreground min-w-36 rounded-xl shadow-edge-raised relative isolate z-50 max-h-[var(--bits-floating-available-height,100svh)] max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain",
			className,
		)}
		{...restProps}
	>
		<SelectScrollUpButton />
		<SelectPrimitive.Viewport
			class={cn(
				"h-(--bits-select-anchor-height) w-full min-w-(--bits-select-anchor-width) scroll-my-1 p-1",
			)}
		>
			{@render children?.()}
		</SelectPrimitive.Viewport>
		<SelectScrollDownButton />
	</SelectPrimitive.Content>
</SelectPortal>
