<script lang="ts">
	import type { Command as CommandPrimitive, Dialog as DialogPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import Command from "#src/shadcn/command/command.svelte";
	import * as Dialog from "#src/shadcn/dialog/index.js";
	import { cn, type WithoutChildrenOrChild } from "@heyramzi/utils";

	let {
		open = $bindable(false),
		ref = $bindable(null),
		value = $bindable(""),
		title = "Command Palette",
		description = "Search for a command to run...",
		showCloseButton = false,
		portalProps,
		children,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.RootProps> &
		WithoutChildrenOrChild<CommandPrimitive.RootProps> & {
			portalProps?: DialogPrimitive.PortalProps;
			children: Snippet;
			title?: string;
			description?: string;
			showCloseButton?: boolean;
			class?: string;
		} = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Header class="sr-only">
		<Dialog.Title>{title}</Dialog.Title>
		<Dialog.Description>{description}</Dialog.Description>
	</Dialog.Header>
	<Dialog.Content
		class={cn(
			// WHY: search is the one dialog that must sit above the keyboard rather

			// than under it, so it stays top-anchored on phones instead of taking the shared bottom-sheet position, and hugs the safe area at the top.
			"rounded-xl! top-[max(0.5rem,env(safe-area-inset-top))] right-2 bottom-auto left-2 w-auto max-h-[70svh] translate-y-0 gap-0 overflow-hidden p-0 sm:p-0",
			// WHY no border and no card background here: the palette is a floating

			// object, so its edge is a lit rim and a cast shadow rather than a drawn line, and the surface itself belongs to the Command root beneath so its translucency

			// can read the dimmed page through it.
			"border-0 bg-transparent ring-1 ring-foreground/15 shadow-overlay",
			// WHY a third of the way down rather than centred: the eye is already at

			// the top of the screen when the shortcut is pressed, and a list that grows downward should not push its first row past the fold.
			"sm:top-[14vh] sm:right-auto sm:left-1/2 sm:w-full sm:max-h-[min(32rem,72svh)] sm:max-w-[640px] sm:translate-y-0",
			className,
		)}
		data-command-dialog="true"
		overlayClass="t-instant"
		{showCloseButton}
		{portalProps}
	>
		<Command
			{...restProps}
			bind:value
			bind:ref
			class="bg-popover supports-backdrop-filter:bg-popover/94 supports-backdrop-filter:backdrop-blur-2xl"
			{children}
		/>
	</Dialog.Content>
</Dialog.Root>
