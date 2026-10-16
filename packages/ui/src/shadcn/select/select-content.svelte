<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import SelectPortal from "#src/shadcn/select/select-portal.svelte";
	import SelectScrollUpButton from "#src/shadcn/select/select-scroll-up-button.svelte";
	import SelectScrollDownButton from "#src/shadcn/select/select-scroll-down-button.svelte";
	import { cn, type WithoutChild } from "@heyramzi/utils";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
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
		{preventScroll}
		data-slot="select-content"
		class={cn(
			"t-dropdown bg-popover text-popover-foreground ring-foreground/10 min-w-36 rounded-xl shadow-raised ring-1 relative isolate z-50 max-h-[var(--bits-floating-available-height,100svh)] max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain",
			className,
		)}
		{...restProps}
	>
		<SelectScrollUpButton />
		<SelectPrimitive.Viewport
			class={cn(
				"h-(--bits-select-anchor-height) w-full min-w-(--bits-select-anchor-width) scroll-my-1",
			)}
		>
			{@render children?.()}
		</SelectPrimitive.Viewport>
		<SelectScrollDownButton />
	</SelectPrimitive.Content>
</SelectPortal>
