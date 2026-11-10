<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Editor } from "@tiptap/core";
	import { Toolbar } from "bits-ui";
	import { Button } from "#src/shadcn/button/index.js";
	import { Input } from "#src/shadcn/input/index.js";
	import { Kbd } from "#src/shadcn/kbd/index.js";
	import * as Popover from "#src/shadcn/popover/index.js";
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
	import {
		TextB,
		TextItalic,
		TextStrikethrough,
		LinkSimple,
		LinkBreak,
		ListBullets,
		ListNumbers,
		Quotes,
		VideoCamera,
	} from "phosphor-svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		editor: Editor | null;
		/** Bumped by the parent on every transaction, so active states re-read. */
		tick: number;
		preset: "full" | "notes";
		onInsertYoutube: () => void;
	}

	type Tool = {
		label: string;
		keys?: string;
		icon: typeof TextB;
		bold?: boolean;
		pressed?: boolean;
		run: () => void;
	};

	// =========================
	// PROPS
	// =========================
	let { editor: editorProp, tick, preset, onInsertYoutube }: Props = $props();

	// =========================
	// CONSTANTS
	// =========================
	const TOOL = "text-muted-foreground aria-pressed:bg-brand/10 aria-pressed:text-brand";
	const LEVELS = [1, 2, 3] as const;

	// =========================
	// STATE
	// =========================
	let linkUrl = $state("");
	let showLinkPopover = $state(false);
	let linkButton = $state<HTMLElement | null>(null);
	let linkContent = $state<HTMLElement | null>(null);

	// =========================
	// DERIVED
	// =========================
	let editor: Editor | null = $derived(tick >= 0 ? editorProp : null);
	let linkActive = $derived(isActive("link"));
	let heading = $derived(LEVELS.find((level) => isActive("heading", { level }))?.toString() ?? "");

	// =========================
	// FUNCTIONS
	// =========================
	/**
	 * Active state for a toolbar button. `editor` is the same object every transaction, so a
	 * derived of it never re-runs the template; reading `tick` here does.
	 */
	function isActive(name: string, attributes?: Record<string, unknown>): boolean {
		return tick >= 0 && (editor?.isActive(name, attributes) ?? false);
	}

	/** The heading group's value: a level, or "" when the pressed one is pressed again. */
	function setHeading(value: string) {
		const level = LEVELS.find((l) => l.toString() === (value || heading));
		if (level) editor?.chain().focus().toggleHeading({ level }).run();
	}

	/** Opens the link field, or removes the link under the cursor. The editor binds Cmd+K to it. */
	export function toggleLink() {
		if (!editor) return;
		if (editor.isActive("link")) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		if (showLinkPopover) {
			showLinkPopover = false;
			return;
		}
		linkUrl = editor.getAttributes("link").href || "";
		showLinkPopover = true;
	}

	function applyLink() {
		if (linkUrl.trim()) editor?.chain().setLink({ href: linkUrl.trim() }).run();
		showLinkPopover = false;
	}

	/** Closing the field puts focus back in the text, unless a click already sent it elsewhere. */
	function returnToText(e: Event) {
		e.preventDefault();
		linkUrl = "";
		const active = document.activeElement;
		if (!active || active === document.body || linkContent?.contains(active)) {
			editor?.commands.focus();
		}
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet tip(label: string, keys?: string)}
	{label}
	{#if keys}<Kbd>{keys}</Kbd>{/if}
{/snippet}

{#snippet tool(t: Tool)}
	<Tooltip.Root>
		<Tooltip.Trigger aria-label={t.label} aria-pressed={t.pressed} onclick={t.run}>
			{#snippet child({ props: trigger })}
				<Toolbar.Button {...trigger}>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="sm" icon class={TOOL}>
							<t.icon aria-hidden="true" size={15} weight={t.bold ? "bold" : undefined} />
						</Button>
					{/snippet}
				</Toolbar.Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{@render tip(t.label, t.keys)}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<Tooltip.Provider>
	<Toolbar.Root aria-label="Formatting">
		{#snippet child({ props: root })}
			<div {...root} class="editor-toolbar">
				{#if editor}
					<Toolbar.Group
						type="single"
						class="flex items-center gap-px"
						aria-label="Heading"
						bind:value={() => heading, setHeading}
					>
						{#each LEVELS as level (level)}
							<Tooltip.Root>
								<Tooltip.Trigger aria-label="Heading {level}">
									{#snippet child({ props: trigger })}
										<Toolbar.GroupItem {...trigger} value={level.toString()}>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="sm"
													icon
													class="text-muted-foreground aria-checked:bg-brand/10 aria-checked:text-brand font-heading text-xs font-bold"
												>
													H{level}
												</Button>
											{/snippet}
										</Toolbar.GroupItem>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content
									>{@render tip(`Heading ${level}`, `Cmd+Alt+${level}`)}</Tooltip.Content
								>
							</Tooltip.Root>
						{/each}
					</Toolbar.Group>

					<div class="toolbar-divider"></div>

					{@render tool({
						label: "Bold",
						keys: "Cmd+B",
						icon: TextB,
						bold: true,
						pressed: isActive("bold"),
						run: () => editor?.chain().focus().toggleBold().run(),
					})}
					{@render tool({
						label: "Italic",
						keys: "Cmd+I",
						icon: TextItalic,
						pressed: isActive("italic"),
						run: () => editor?.chain().focus().toggleItalic().run(),
					})}
					{@render tool({
						label: "Strikethrough",
						keys: "Cmd+Shift+S",
						icon: TextStrikethrough,
						pressed: isActive("strike"),
						run: () => editor?.chain().focus().toggleStrike().run(),
					})}

					<div class="toolbar-divider"></div>

					<!-- One button that changes its job, so the toolbar's Tab stop never lands on a removed node. -->
					<Tooltip.Root>
						<Tooltip.Trigger
							aria-label={linkActive ? "Remove link" : "Add link"}
							aria-pressed={linkActive || undefined}
							aria-expanded={linkActive ? undefined : showLinkPopover}
							onclick={toggleLink}
						>
							{#snippet child({ props: trigger })}
								<Toolbar.Button {...trigger} bind:ref={linkButton}>
									{#snippet child({ props })}
										<Button {...props} variant="ghost" size="sm" icon class={TOOL}>
											{#if linkActive}
												<LinkBreak aria-hidden="true" size={15} />
											{:else}
												<LinkSimple aria-hidden="true" size={15} />
											{/if}
										</Button>
									{/snippet}
								</Toolbar.Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>
							{@render tip(linkActive ? "Remove link" : "Add link", "Cmd+K")}
						</Tooltip.Content>
					</Tooltip.Root>

					<div class="toolbar-divider"></div>

					{@render tool({
						label: "Bullet list",
						keys: "Cmd+Shift+8",
						icon: ListBullets,
						pressed: isActive("bulletList"),
						run: () => editor?.chain().focus().toggleBulletList().run(),
					})}
					{@render tool({
						label: "Ordered list",
						keys: "Cmd+Shift+7",
						icon: ListNumbers,
						pressed: isActive("orderedList"),
						run: () => editor?.chain().focus().toggleOrderedList().run(),
					})}
					{@render tool({
						label: "Quote",
						keys: "Cmd+Shift+B",
						icon: Quotes,
						pressed: isActive("blockquote"),
						run: () => editor?.chain().focus().toggleBlockquote().run(),
					})}

					{#if preset === "full"}
						<div class="toolbar-divider"></div>

						{@render tool({
							label: "Insert YouTube video",
							icon: VideoCamera,
							pressed: isActive("youtube"),
							run: onInsertYoutube,
						})}
					{/if}
				{/if}
			</div>
		{/snippet}
	</Toolbar.Root>
</Tooltip.Provider>

<Popover.Root bind:open={showLinkPopover}>
	<Popover.Content
		bind:ref={linkContent}
		customAnchor={linkButton}
		align="start"
		class="w-auto rounded-xl p-1.5"
		onCloseAutoFocus={returnToText}
		onInteractOutside={(e) => {
			if (linkButton?.contains(e.target as Node)) e.preventDefault();
		}}
	>
		<form
			class="link-popover"
			novalidate
			onsubmit={(e) => {
				e.preventDefault();
				applyLink();
			}}
		>
			<Input
				type="url"
				bind:value={linkUrl}
				placeholder="Paste link..."
				class="h-7 w-52 text-[0.8125rem]"
			/>
			<Button type="submit" size="sm" icon aria-label="Apply link">
				<LinkSimple aria-hidden="true" size={14} />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground"
				onclick={() => (showLinkPopover = false)}
				aria-label="Cancel link"
			>
				<span aria-hidden="true">&times;</span>
			</Button>
		</form>
	</Popover.Content>
</Popover.Root>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	@layer theme, base, components, utilities;

	@layer components {
		/* ---- PERSISTENT TOOLBAR ---- */
		.editor-toolbar {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 1px;
			padding: 6px 8px;
			border-bottom: 1px solid var(--color-border);
			background: oklch(from var(--color-muted) l c h / 0.35);
			border-top-left-radius: var(--radius-xl);
			border-top-right-radius: var(--radius-xl);
			min-height: 2.375rem;
		}

		.toolbar-divider {
			width: 1px;
			height: 1rem;
			background: var(--color-border);
			margin: 0 4px;
			opacity: 0.6;
		}

		/* ---- LINK POPOVER ---- */
		.link-popover {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 1px;
		}
	}
</style>
