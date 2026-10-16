<script lang="ts">
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON,
	} from "#src/shadcn/sidebar/constants.js";
	import { setSidebar } from "#src/shadcn/sidebar/context.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(true),
		onOpenChange = () => {},
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	let openState = $state(open);

	$effect(() => {
		openState = open;
	});

	const sidebar = setSidebar({
		open: () => openState,
		setOpen: (value: boolean) => {
			openState = value;
			open = value;
			onOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<Tooltip.Provider delayDuration={0}>
	<!-- An h-svh frame that never scrolls: the app puts its page in a
	     `min-h-0 flex-1 overflow-y-auto` column inside Sidebar.Inset, or nothing scrolls. -->
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn(
			"group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex h-svh w-full overflow-hidden",
			className,
		)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
