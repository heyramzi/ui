<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Editor } from "@tiptap/core";
	import { NodeSelection } from "@tiptap/pm/state";
	import { untrack } from "svelte";
	import "#src/editor/content.css";
	import "#src/editor/doc-page.css";
	import { buildExtensions } from "#src/editor/extensions.js";
	import { buildSlashItems, type SlashItem } from "#src/editor/slash-items.js";
	import { SLASH_WINDOW, slashQueryAt } from "#src/editor/slash-query.js";
	import { parseYoutubeUrl } from "#src/editor/youtube-url.js";
	import { safeImageUrl } from "#src/editor/safe-url.js";
	import EditorToolbar from "#src/editor/editor-toolbar.svelte";
	import SlashMenu from "#src/editor/slash-menu.svelte";
	import ImageToolbar from "#src/editor/image-toolbar.svelte";
	import UrlDialog from "#src/editor/url-dialog.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		content?: Record<string, unknown> | null;
		onContentChange?: (json: Record<string, unknown>) => void;
		placeholder?: string;
		minHeight?: string;
		preset?: "full" | "notes";
		blockIds?: boolean;
		/**
		 * `box` is the framed editor with a toolbar. `page` is a document: no frame, no toolbar,
		 * type set by `.doc-surface` (see doc-page.css), heading anchors on.
		 */
		variant?: "box" | "page";
		/** The word on a heading's hover button, for `page`. */
		copyLinkLabel?: string;
		/** A heading's link was copied. */
		onCopyLink?: (url: string, id: string) => void;
		/** The live editor, for a host that needs focus or the document. */
		instance?: Editor | null;
		/** The editable region's accessible name. */
		label?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		content = null,
		onContentChange,
		placeholder = "Start writing...",
		minHeight = "28rem",
		preset = "full",
		blockIds = false,
		variant = "box",
		copyLinkLabel = "Copy link",
		onCopyLink,
		instance = $bindable(null),
		label = "Text editor",
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
	const uid = $props.id();
	const slashMenuId = `${uid}-slash`;
	let toolbar: EditorToolbar | undefined = $state();

	// Insert dialogs
	let showImageDialog = $state(false);
	let showVideoDialog = $state(false);

	// Image toolbar
	let showImageToolbar = $state(false);
	let activeImageElement: HTMLImageElement | null = $state(null);

	// =========================
	// DERIVED
	// =========================
	let editor: Editor | null = $derived(tick >= 0 ? editorInstance : null);
	let isPage = $derived(variant === "page");

	$effect(() => {
		instance = editorInstance;
	});

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

	// Focus stays in the text while the menu is open, so the text points at the highlighted command.
	$effect(() => {
		const dom = editor?.view.dom;
		if (!dom) return;
		if (showSlashMenu && slashItems.length > 0) {
			dom.setAttribute("aria-controls", slashMenuId);
			dom.setAttribute("aria-activedescendant", `${slashMenuId}-${slashSelectedIndex}`);
		} else {
			dom.removeAttribute("aria-controls");
			dom.removeAttribute("aria-activedescendant");
		}
	});

	// Close the slash menu on outside click. The image toolbar's Popover closes itself.
	$effect(() => {
		if (!showSlashMenu) return;
		document.addEventListener("mousedown", closeSlashMenuOutside);
		return () => document.removeEventListener("mousedown", closeSlashMenuOutside);
	});

	// =========================
	// FUNCTIONS
	// =========================
	function insertImageFromSlash() {
		showImageDialog = true;
	}

	function insertYoutubeVideo() {
		showVideoDialog = true;
	}

	// The dialog holds focus while these run, so they leave focusing the text to its close.
	function insertImage(url: string): string | null {
		if (!url) return "Paste an image link.";
		const src = safeImageUrl(url);
		if (!src) return "That is not a link to an image.";
		editor?.chain().setImage({ src }).run();
		return null;
	}

	function insertVideo(url: string, title: string): string | null {
		if (!url) return "Paste a YouTube link.";
		const parsed = parseYoutubeUrl(url);
		if (!parsed) return "That is not a recognized YouTube URL.";
		editor
			?.chain()
			.insertContent({
				type: "youtube",
				attrs: { videoId: parsed.videoId, title, start: parsed.start },
			})
			.run();
		return null;
	}

	function closeSlashMenu() {
		showSlashMenu = false;
		slashQuery = "";
	}

	function closeSlashMenuOutside(e: MouseEvent) {
		if (slashMenuEl && !slashMenuEl.contains(e.target as Node)) closeSlashMenu();
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

	function openImageToolbar(img: HTMLImageElement) {
		activeImageElement = img;
		showImageToolbar = true;
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

		const extensions = buildExtensions({
			preset,
			placeholder,
			blockIds,
			anchors: variant === "page" ? { label: copyLinkLabel, onCopy: onCopyLink } : false,
		});

		editorInstance = new Editor({
			element: editorElement,
			extensions,
			content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
			editorProps: {
				// A function, so ProseMirror reads the current label on every update.
				attributes: () => ({ "aria-label": label }),
				handleKeyDown: (_view, event) => {
					const mod = event.metaKey || event.ctrlKey;
					if (
						mod &&
						!event.altKey &&
						!event.shiftKey &&
						event.key.toLowerCase() === "k" &&
						toolbar
					) {
						event.preventDefault();
						toolbar.toggleLink();
						return true;
					}
					// No items means no menu on screen, so Enter and the arrows stay the editor's.
					if (showSlashMenu && slashItems.length > 0) {
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
					if (preset === "full" && target instanceof HTMLImageElement) {
						openImageToolbar(target);
						return true;
					}
					showImageToolbar = false;
					activeImageElement = null;
					return false;
				},
			},
			// Arrowing onto an image selects it as a node: the same toolbar opens, next in Tab order.
			onSelectionUpdate: ({ editor: e }) => {
				if (preset !== "full") return;
				const { selection } = e.state;
				const isImage = selection instanceof NodeSelection && selection.node.type.name === "image";
				const dom = isImage ? e.view.nodeDOM(selection.from) : null;
				const img =
					dom instanceof HTMLImageElement ? dom : (dom as Element | null)?.querySelector("img");
				if (img) openImageToolbar(img);
				else if (showImageToolbar) {
					showImageToolbar = false;
					activeImageElement = null;
				}
			},
			onUpdate: ({ editor: e }) => {
				onContentChange?.(e.getJSON());

				const { from } = e.state.selection;
				const textBefore = e.state.doc.textBetween(Math.max(0, from - SLASH_WINDOW), from, "\n");
				const query = slashQueryAt(textBefore);

				if (query !== null) {
					slashQuery = query;
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

	// Only the element mounts the editor. Read tracked, `content` (fed back by onContentChange) and
	// the `tick++` each transaction makes would destroy and rebuild it until Svelte stops the loop.
	$effect(() => {
		if (editorElement) return untrack(mount);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class="editor-wrapper"
	class:focused={tick >= 0 && editor?.isFocused && !isPage}
	class:page={isPage}
	class:doc-surface={isPage}
	style="--editor-min-height: {minHeight};"
>
	{#if !isPage}
		<EditorToolbar
			bind:this={toolbar}
			{editor}
			{tick}
			{preset}
			onInsertYoutube={insertYoutubeVideo}
		/>
	{/if}

	<!-- Editor surface -->
	<div bind:this={editorElement} class="editor-surface tiptap-content"></div>

	<!-- Slash command menu -->
	{#if showSlashMenu && slashItems.length > 0}
		<SlashMenu
			id={slashMenuId}
			items={slashItems}
			pos={slashMenuPos}
			bind:selectedIndex={slashSelectedIndex}
			bind:el={slashMenuEl}
			onSelect={executeSlashCommand}
		/>
	{/if}

	<!-- Image toolbar (full preset only) -->
	{#if preset === "full"}
		<ImageToolbar
			anchor={activeImageElement}
			bind:open={showImageToolbar}
			onAlign={setImageAlignment}
			onDelete={deleteActiveImage}
		/>
		<UrlDialog
			bind:open={showImageDialog}
			heading="Insert image"
			label="Image link"
			placeholder="https://example.com/photo.png"
			onSubmit={insertImage}
			onClosed={() => editor?.commands.focus()}
		/>
		<UrlDialog
			bind:open={showVideoDialog}
			heading="Insert YouTube video"
			label="YouTube link"
			placeholder="https://www.youtube.com/watch?v=..."
			titleLabel="Title (optional)"
			onSubmit={insertVideo}
			onClosed={() => editor?.commands.focus()}
		/>
	{/if}

	<!-- Status bar -->
	{#if editor && !isPage}
		<div class="status-bar">
			<span class="status-hint">Type <kbd>/</kbd> for commands</span>
		</div>
	{/if}
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	@layer theme, base, components, utilities;

	@layer components {
		/* ---- WRAPPER ---- */
		.editor-wrapper {
			position: relative;
			border-radius: var(--radius-xl);
			background: var(--color-card);
			border: 1px solid var(--color-border);
			transition:
				border-color var(--duration-quick) var(--ease-smooth-out),
				box-shadow var(--duration-quick) var(--ease-smooth-out);
		}

		.editor-wrapper.focused {
			border-color: oklch(from var(--color-brand) l c h / 0.25);
			box-shadow: 0 0 0 3px oklch(from var(--color-brand) l c h / 0.06);
		}

		/* A document page owns its frame, so the editor draws none. */
		.editor-wrapper.page {
			border: 0;
			border-radius: 0;
			background: transparent;
		}

		.editor-wrapper.page .editor-surface :global(.tiptap) {
			outline: none;
			min-height: var(--editor-min-height, 28rem);
		}

		/* ---- EDITOR SURFACE ---- */
		.editor-surface {
			min-height: var(--editor-min-height, 28rem);
		}

		.editor-wrapper:not(.page) .editor-surface :global(.tiptap) {
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
	}
</style>
