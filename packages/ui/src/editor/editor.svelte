<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Editor } from "@tiptap/core";
	import { untrack } from "svelte";
	import "#src/editor/content.css";
	import { buildExtensions } from "#src/editor/extensions.js";
	import { buildSlashItems, type SlashItem } from "#src/editor/slash-items.js";
	import { parseYoutubeUrl } from "#src/editor/youtube-url.js";
	import EditorToolbar from "#src/editor/editor-toolbar.svelte";
	import SlashMenu from "#src/editor/slash-menu.svelte";
	import ImageToolbar from "#src/editor/image-toolbar.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		content?: Record<string, unknown> | null;
		onchange?: (json: Record<string, unknown>) => void;
		placeholder?: string;
		minHeight?: string;
		preset?: "full" | "notes";
		blockIds?: boolean;
	}

	// =========================
	// PROPS
	// =========================
	let {
		content = null,
		onchange,
		placeholder = "Start writing...",
		minHeight = "28rem",
		preset = "full",
		blockIds = false,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let editorElement: HTMLDivElement | undefined = $state();
	let editorInstance = $state<Editor | null>(null);
	let tick = $state(0);

	// Slash commands
	let showSlashMenu = $state(false);
	let slashQuery = $state("");
	let slashMenuPos = $state({ top: 0, left: 0 });
	let slashSelectedIndex = $state(0);
	let slashMenuEl: HTMLDivElement | undefined = $state();

	// Image toolbar
	let showImageToolbar = $state(false);
	let imageToolbarPos = $state({ top: 0, left: 0 });
	let activeImageElement: HTMLImageElement | null = $state(null);

	// =========================
	// DERIVED
	// =========================
	let editor: Editor | null = $derived(tick >= 0 ? editorInstance : null);

	let slashItems = $derived.by((): SlashItem[] =>
		editor
			? buildSlashItems(editor, slashQuery, {
					preset,
					insertImage: insertImageFromSlash,
					insertYoutube: insertYoutubeVideo,
				})
			: [],
	);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (showSlashMenu) {
			slashSelectedIndex = 0;
		}
	});

	// Close menus on outside click
	$effect(() => {
		if (!showSlashMenu && !showImageToolbar) return;
		function handleClick(e: MouseEvent) {
			const target = e.target as Node;
			if (slashMenuEl && !slashMenuEl.contains(target)) {
				closeSlashMenu();
			}
			// Close image toolbar when clicking outside editor or on non-image
			if (showImageToolbar && editorElement && !editorElement.contains(target)) {
				showImageToolbar = false;
				activeImageElement = null;
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	});

	// =========================
	// FUNCTIONS
	// =========================
	function insertImageFromSlash() {
		const url = prompt("Image URL:");
		if (url?.trim()) {
			editor?.chain().focus().setImage({ src: url.trim() }).run();
		}
	}

	function insertYoutubeVideo() {
		const url = prompt("YouTube URL:");
		if (!url?.trim()) return;
		const parsed = parseYoutubeUrl(url.trim());
		if (!parsed) {
			alert("That is not a recognized YouTube URL.");
			return;
		}
		const title = prompt("Video title:")?.trim() || "";
		editor
			?.chain()
			.focus()
			.insertContent({
				type: "youtube",
				attrs: { videoId: parsed.videoId, title, start: parsed.start },
			})
			.run();
	}

	function closeSlashMenu() {
		showSlashMenu = false;
		slashQuery = "";
	}

	function executeSlashCommand(item: SlashItem) {
		if (!editor) return;
		const { from } = editor.state.selection;
		const slashStart = from - slashQuery.length - 1;
		editor.chain().focus().deleteRange({ from: slashStart, to: from }).run();
		item.command();
		closeSlashMenu();
	}

	function getCaretCoords(): { top: number; left: number } {
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) return { top: 0, left: 0 };
		const range = sel.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		const wrapperRect = editorElement?.getBoundingClientRect();
		if (!wrapperRect) return { top: 0, left: 0 };
		return {
			top: rect.bottom - wrapperRect.top + 4,
			left: rect.left - wrapperRect.left,
		};
	}

	function setImageAlignment(align: "left" | "center" | "right") {
		if (!editor || !activeImageElement) return;
		const { state } = editor;
		const { selection } = state;
		const { from, to } = selection;

		editor
			.chain()
			.focus()
			.command(({ tr }) => {
				tr.doc.nodesBetween(from, to, (node, pos) => {
					if (node.type.name === "image") {
						tr.setNodeMarkup(pos, undefined, { ...node.attrs, align });
					}
					return true;
				});
				return true;
			})
			.run();

		showImageToolbar = false;
		activeImageElement = null;
	}

	function deleteActiveImage() {
		if (!editor || !activeImageElement) return;
		const { state } = editor;
		const { selection } = state;
		const { from, to } = selection;

		editor
			.chain()
			.focus()
			.command(({ tr }) => {
				tr.doc.nodesBetween(from, to, (node, pos) => {
					if (node.type.name === "image") {
						tr.delete(pos, pos + node.nodeSize);
					}
					return false;
				});
				return true;
			})
			.run();

		showImageToolbar = false;
		activeImageElement = null;
	}

	function mount() {
		if (!editorElement || editorInstance) return;

		const extensions = buildExtensions({ preset, placeholder, blockIds });

		editorInstance = new Editor({
			element: editorElement,
			extensions,
			content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
			editorProps: {
				handleKeyDown: (_view, event) => {
					if (showSlashMenu) {
						if (event.key === "ArrowDown") {
							event.preventDefault();
							slashSelectedIndex = (slashSelectedIndex + 1) % slashItems.length;
							return true;
						}
						if (event.key === "ArrowUp") {
							event.preventDefault();
							slashSelectedIndex = (slashSelectedIndex - 1 + slashItems.length) % slashItems.length;
							return true;
						}
						if (event.key === "Enter") {
							event.preventDefault();
							if (slashItems[slashSelectedIndex]) {
								executeSlashCommand(slashItems[slashSelectedIndex]);
							}
							return true;
						}
						if (event.key === "Escape") {
							event.preventDefault();
							closeSlashMenu();
							return true;
						}
						if (event.key === "Backspace" && slashQuery.length === 0) {
							closeSlashMenu();
							return false;
						}
					}
					return false;
				},
				// handleClick, not handleClickOn: ProseMirror tries both in the same spot, and
				// this one needs only the event.
				handleClick(_view, _pos, event) {
					const target = event.target as HTMLElement;
					if (preset === "full" && target?.tagName === "IMG") {
						activeImageElement = target as HTMLImageElement;
						const rect = target.getBoundingClientRect();
						const wrapperRect = editorElement?.getBoundingClientRect();
						if (wrapperRect) {
							imageToolbarPos = {
								top: rect.top - wrapperRect.top - 40,
								left: rect.left - wrapperRect.left + rect.width / 2 - 60,
							};
							showImageToolbar = true;
						}
						return true;
					}
					showImageToolbar = false;
					activeImageElement = null;
					return false;
				},
			},
			onUpdate: ({ editor: e }) => {
				onchange?.(e.getJSON());

				const { from } = e.state.selection;
				const textBefore = e.state.doc.textBetween(Math.max(0, from - 20), from, "\n");
				const slashMatch = textBefore.match(/\/([a-zA-Z0-9 ]*)$/);

				if (slashMatch) {
					slashQuery = slashMatch[1];
					slashMenuPos = getCaretCoords();
					showSlashMenu = true;
				} else if (showSlashMenu) {
					closeSlashMenu();
				}
			},
			onTransaction: () => {
				tick++;
			},
			onFocus: () => {
				tick++;
			},
			onBlur: () => {
				tick++;
			},
		});
		tick++;

		return () => {
			editorInstance?.destroy();
			editorInstance = null;
		};
	}

	// Only the element mounts the editor. Read tracked, `content` (fed back by onchange) and the
	// `tick++` each transaction makes would destroy and rebuild it until Svelte stops the loop.
	$effect(() => {
		if (editorElement) return untrack(mount);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class="editor-wrapper"
	class:focused={editor?.isFocused}
	style="--editor-min-height: {minHeight};"
>
	<EditorToolbar {editor} {tick} {preset} onInsertYoutube={insertYoutubeVideo} />

	<!-- Editor surface -->
	<div bind:this={editorElement} class="editor-surface tiptap-content"></div>

	<!-- Slash command menu -->
	{#if showSlashMenu && slashItems.length > 0}
		<SlashMenu
			items={slashItems}
			pos={slashMenuPos}
			bind:selectedIndex={slashSelectedIndex}
			bind:el={slashMenuEl}
			onselect={executeSlashCommand}
		/>
	{/if}

	<!-- Image toolbar (full preset only) -->
	{#if preset === "full" && showImageToolbar}
		<ImageToolbar pos={imageToolbarPos} onalign={setImageAlignment} ondelete={deleteActiveImage} />
	{/if}

	<!-- Status bar -->
	{#if editor}
		<div class="status-bar">
			<span class="status-hint">Type <kbd>/</kbd> for commands</span>
		</div>
	{/if}
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* ---- WRAPPER ---- */
	.editor-wrapper {
		position: relative;
		border-radius: var(--radius-xl);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		transition:
			border-color var(--duration-quick) var(--ease-smooth-out),
			box-shadow var(--duration-quick) var(--ease-smooth-out);
	}

	.editor-wrapper.focused {
		border-color: oklch(from var(--color-brand) l c h / 0.25);
		box-shadow: 0 0 0 3px oklch(from var(--color-brand) l c h / 0.06);
	}

	/* ---- EDITOR SURFACE ---- */
	.editor-surface {
		min-height: var(--editor-min-height, 28rem);
	}

	.editor-surface :global(.tiptap) {
		padding: 2rem 2.5rem;
		outline: none;
		min-height: var(--editor-min-height, 28rem);
		font-size: 1rem;
		line-height: 1.75;
		color: var(--color-foreground);
		caret-color: var(--color-brand);
	}

	/* Placeholder */
	.editor-surface :global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: var(--color-muted-foreground);
		opacity: 0.4;
		pointer-events: none;
		float: left;
		height: 0;
	}

	/* Node typography (h1-h4, p, ul/ol/li, blockquote, code, pre, a, img, hr, strong)
	   lives in ./content.css which is imported at the top of this component.
	   Editor-only chrome (cursor, hover outline) below. */
	.editor-surface :global(.tiptap .image-wrapper) {
		position: relative;
		display: inline-block;
		max-width: 100%;
	}

	.editor-surface :global(.tiptap img) {
		transition: box-shadow var(--duration-quick) var(--ease-smooth-out);
		cursor: pointer;
	}

	@media (hover: hover) and (pointer: fine) {
		.editor-surface :global(.tiptap img:hover) {
			box-shadow: 0 0 0 2px oklch(from var(--color-brand) l c h / 0.2);
		}
	}

	/* ---- DRAG HANDLE ---- */
	.editor-surface :global(.drag-handle) {
		position: absolute;
		top: 0.25rem;
		left: -1.5rem;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-muted-foreground);
		cursor: grab;
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease-smooth-out);
		border-radius: var(--radius-xs);
	}

	@media (hover: hover) and (pointer: fine) {
		.editor-surface :global(.drag-handle:hover) {
			background: var(--color-accent);
			color: var(--color-foreground);
		}
	}

	.editor-surface :global(.drag-handle:active) {
		cursor: grabbing;
	}

	@media (hover: hover) and (pointer: fine) {
		.editor-surface :global(.tiptap > *:hover .drag-handle) {
			opacity: 0.5;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.editor-surface :global(.tiptap [data-node-view-wrapper]:hover .drag-handle) {
			opacity: 0.5;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.editor-surface :global(.tiptap > *:hover .drag-handle:hover) {
			opacity: 1;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.editor-surface :global(.tiptap [data-node-view-wrapper]:hover .drag-handle:hover) {
			opacity: 1;
		}
	}

	/* ---- STATUS BAR ---- */
	.status-bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0.5rem 1.25rem;
		border-top: 1px solid oklch(from var(--color-border) l c h / 0.5);
	}

	.status-hint {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
		opacity: 0.5;
	}

	.status-hint kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.25rem;
		margin: 0 0.125rem;
		border: 1px solid oklch(from var(--color-border) l c h / 0.6);
		border-radius: var(--radius-xs);
		background: var(--color-muted);
		font-family: var(--font-mono);
		font-size: 0.625rem;
		font-weight: 500;
		line-height: 1;
	}

	/* ---- REDUCED MOTION ---- */
	@media (prefers-reduced-motion: reduce) {
		.editor-wrapper {
			transition: none;
		}
	}
</style>
