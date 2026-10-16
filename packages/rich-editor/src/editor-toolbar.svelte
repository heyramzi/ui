<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Editor } from "@tiptap/core";
import { Button } from "@heyramzi/ui/shadcn/button";
import { Input } from "@heyramzi/ui/shadcn/input";
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

// =========================
// PROPS
// =========================
let { editor: editorProp, tick, preset, onInsertYoutube }: Props = $props();

// =========================
// STATE
// =========================
let linkUrl = $state("");
let showLinkPopover = $state(false);
let linkInputEl: HTMLInputElement | undefined = $state();

// =========================
// DERIVED
// =========================
let editor: Editor | null = $derived(tick >= 0 ? editorProp : null);

// =========================
// EFFECTS
// =========================
$effect(() => {
	if (showLinkPopover && linkInputEl) {
		linkInputEl.focus();
	}
});

// =========================
// FUNCTIONS
// =========================
function toggleLink() {
	if (!editor) return;
	if (editor.isActive("link")) {
		editor.chain().focus().unsetLink().run();
		return;
	}
	const previousUrl = editor.getAttributes("link").href;
	linkUrl = previousUrl || "";
	showLinkPopover = true;
}

function applyLink() {
	if (!editor) return;
	if (linkUrl.trim()) {
		editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
	}
	linkUrl = "";
	showLinkPopover = false;
}

function cancelLink() {
	linkUrl = "";
	showLinkPopover = false;
	editor?.chain().focus().run();
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="editor-toolbar" role="toolbar">
	{#if editor}
		{#if showLinkPopover}
			<div class="link-popover">
				<Input
					bind:ref={linkInputEl}
					type="url"
					bind:value={linkUrl}
					placeholder="Paste link..."
					class="h-7 w-52 text-[0.8125rem]"
					onkeydown={(e) => {
						if (e.key === "Enter") { e.preventDefault(); applyLink(); }
						if (e.key === "Escape") cancelLink();
					}}
				/>
				<Button size="sm" icon onclick={applyLink} aria-label="Apply link">
					<LinkSimple size={14} />
				</Button>
				<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				onclick={cancelLink}
				title="Cancel"
				>
					&times;
				</Button>
			</div>
		{:else}
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo font-heading text-xs font-bold"
				aria-pressed={editor.isActive("heading", { level: 1 })}
				onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
				title="Heading 1"
			>
				H1
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo font-heading text-xs font-bold"
				aria-pressed={editor.isActive("heading", { level: 2 })}
				onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				title="Heading 2"
			>
				H2
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo font-heading text-xs font-bold"
				aria-pressed={editor.isActive("heading", { level: 3 })}
				onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
				title="Heading 3"
			>
				H3
			</Button>

			<div class="toolbar-divider"></div>

			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("bold")}
				onclick={() => editor?.chain().focus().toggleBold().run()}
				title="Bold (Cmd+B)"
			>
				<TextB size={15} weight="bold" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("italic")}
				onclick={() => editor?.chain().focus().toggleItalic().run()}
				title="Italic (Cmd+I)"
			>
				<TextItalic size={15} />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("strike")}
				onclick={() => editor?.chain().focus().toggleStrike().run()}
				title="Strikethrough"
			>
				<TextStrikethrough size={15} />
			</Button>

			<div class="toolbar-divider"></div>

			{#if editor.isActive("link")}
				<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={true}
				onclick={() => editor?.chain().focus().unsetLink().run()}
					title="Remove link"
				>
					<LinkBreak size={15} />
				</Button>
			{:else}
				<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				onclick={toggleLink}
					title="Add link (Cmd+K)">
					<LinkSimple size={15} />
				</Button>
			{/if}

			<div class="toolbar-divider"></div>

			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("bulletList")}
				onclick={() => editor?.chain().focus().toggleBulletList().run()}
				title="Bullet list"
			>
				<ListBullets size={15} />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("orderedList")}
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}
				title="Ordered list"
			>
				<ListNumbers size={15} />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("blockquote")}
				onclick={() => editor?.chain().focus().toggleBlockquote().run()}
				title="Quote"
			>
				<Quotes size={15} />
			</Button>

			{#if preset === "full"}
				<div class="toolbar-divider"></div>

				<Button
				variant="ghost"
				size="sm"
				icon
				class="text-muted-foreground aria-pressed:bg-brand-indigo/10 aria-pressed:text-brand-indigo"
				aria-pressed={editor.isActive("youtube")}
				onclick={onInsertYoutube}
					title="Insert YouTube video">
					<VideoCamera size={15} />
				</Button>
			{/if}
		{/if}
	{/if}
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
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
</style>
