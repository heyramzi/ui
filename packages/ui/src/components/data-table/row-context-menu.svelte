<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import * as ContextMenu from "#src/shadcn/context-menu/index.js";
	import { HoldToConfirm } from "#src/components/hold-to-confirm/index.js";
	import { ArrowUpRight, Copy, LinkSimple, Trash } from "phosphor-svelte";
	import { copyText } from "#src/components/copy/clipboard.js";
	import type { Snippet } from "svelte";
	import { MENU_KEYS, openMenuFromKey } from "#src/components/data-table/menu-key.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		onDelete: () => void;
		href?: string;
		id?: string;
		deleteLabel?: string;
		copyLinkLabel?: string;
		copyIdLabel?: string;
		/** Called after a successful clipboard copy so consumers can show their own toast */
		onCopied?: () => void;
		children: Snippet<[Record<string, unknown>]>;
	}

	// =========================
	// PROPS
	// =========================
	let {
		onDelete,
		href,
		id,
		deleteLabel = "Delete",
		copyLinkLabel = "Copy link",
		copyIdLabel = "Copy ID",
		onCopied,
		children,
	}: Props = $props();

	// =========================
	// FUNCTIONS
	// =========================
	function handleOpen() {
		if (href) window.location.href = href;
	}

	// WHY the whole URL and not the path: what leaves this menu is pasted into a
	// message, a doc or an agent prompt, none of which can resolve "/clients/42".
	async function handleCopyLink() {
		if (!href) return;
		if (await copyText(new URL(href, window.location.origin).href)) onCopied?.();
	}

	async function handleCopyId() {
		if (!id) return;
		if (await copyText(id)) onCopied?.();
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<ContextMenu.Root>
	<ContextMenu.Trigger>
		{#snippet child({ props })}
			{@render children({ ...props, onkeydown: openMenuFromKey, "aria-keyshortcuts": MENU_KEYS })}
		{/snippet}
	</ContextMenu.Trigger>
	<ContextMenu.Content class="w-48">
		{#if href}
			<ContextMenu.Item onclick={handleOpen}>
				<ArrowUpRight aria-hidden="true" size={14} />
				Open
			</ContextMenu.Item>
		{/if}
		{#if href}
			<ContextMenu.Item onclick={handleCopyLink}>
				<LinkSimple aria-hidden="true" size={14} />
				{copyLinkLabel}
			</ContextMenu.Item>
		{/if}
		{#if id}
			<ContextMenu.Item onclick={handleCopyId}>
				<Copy aria-hidden="true" size={14} />
				{copyIdLabel}
			</ContextMenu.Item>
		{/if}
		{#if href || id}
			<ContextMenu.Separator />
		{/if}
		<HoldToConfirm
			duration={800}
			onConfirm={onDelete}
			class="relative flex w-full cursor-default items-center justify-start gap-2 rounded-lg px-1.5 py-1 text-sm text-destructive-ink outline-hidden"
		>
			{#snippet idle()}
				<Trash aria-hidden="true" size={14} />
				{deleteLabel}
			{/snippet}
			{#snippet holding()}
				Hold to delete...
			{/snippet}
		</HoldToConfirm>
	</ContextMenu.Content>
</ContextMenu.Root>
