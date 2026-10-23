<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Editor } from "@tiptap/core";
	import { FileText } from "phosphor-svelte";
	import type { Snippet } from "svelte";
	import OnThisPage from "#src/components/docs/on-this-page.svelte";
	import { ScrollSpy } from "#src/components/docs/scroll-spy.svelte.js";
	import RichEditor from "#src/editor/editor.svelte";
	import { docLabels, type DocLabels } from "#src/work/docs/labels.js";
	import { outlineOfDoc, type OutlineHeading } from "#src/work/docs/outline.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The title, edited in place. */
		title: string;
		/** The body as Tiptap JSON. Read once: wrap the page in `{#key doc.id}` to swap documents. */
		content?: Record<string, unknown> | null;
		onchange?: (json: Record<string, unknown>) => void;
		ontitle?: (title: string) => void;
		/** Focus the title on open: a doc that was just created. */
		autofocusTitle?: boolean;
		/** Parent icon, parent title › this doc. */
		breadcrumb?: Snippet;
		/** Sits beside the breadcrumb: the star, the `…` menu. */
		menu?: Snippet;
		/** Right side of the bar, before the actions: the "Edited" chip. */
		meta?: Snippet;
		/** Right side of the bar: copy link, subscribe. */
		actions?: Snippet;
		/** The tile above the title. Defaults to a document glyph. */
		icon?: Snippet;
		/** A heading's link was copied; show the toast here. */
		oncopylink?: (url: string, id: string) => void;
		labels?: Partial<DocLabels>;
		/** The live editor, to focus it or read it. */
		instance?: Editor | null;
	}

	// =========================
	// PROPS
	// =========================
	let {
		title = $bindable(""),
		content = null,
		onchange,
		ontitle,
		autofocusTitle = false,
		breadcrumb,
		menu,
		meta,
		actions,
		icon,
		oncopylink,
		labels: labelOverrides,
		instance = $bindable(null),
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let scroller = $state<HTMLElement | null>(null);
	let titleField = $state<HTMLTextAreaElement | null>(null);
	let outline = $state<OutlineHeading[]>(outlineOfDoc(untrackedContent()));
	const spy = new ScrollSpy();

	// =========================
	// DERIVED
	// =========================
	let t = $derived(docLabels(labelOverrides));

	// =========================
	// EFFECTS
	// =========================
	$effect(() => spy.attach(scroller, outline));

	$effect(() => {
		if (autofocusTitle) titleField?.focus();
	});

	// =========================
	// FUNCTIONS
	// =========================
	// The first outline reads the prop once; later ones come from the editor's own changes.
	function untrackedContent() {
		return content;
	}

	function handleChange(json: Record<string, unknown>) {
		outline = outlineOfDoc(json);
		onchange?.(json);
	}

	function onTitleKey(event: KeyboardEvent) {
		if (event.key === "Enter" || (event.key === "ArrowDown" && !event.shiftKey)) {
			event.preventDefault();
			instance?.commands.focus("start");
		}
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="@container/doc flex h-full min-h-0 flex-col bg-background text-foreground">
	<header
		class="flex h-11 shrink-0 items-center gap-2 border-b border-border/70 px-3 @2xl/doc:px-4"
	>
		<div class="flex min-w-0 flex-1 items-center gap-1 text-[13px]">
			{#if breadcrumb}{@render breadcrumb()}{/if}
			{#if menu}{@render menu()}{/if}
		</div>
		<div class="flex shrink-0 items-center gap-1">
			{#if meta}{@render meta()}{/if}
			{#if actions}{@render actions()}{/if}
		</div>
	</header>

	<div class="relative min-h-0 flex-1">
		{#if outline.length > 0}
			<!-- Wide: ticks in the left gutter, centred on the pane. -->
			<div class="absolute top-1/2 left-1 z-20 hidden -translate-y-1/2 @4xl/doc:block">
				<OnThisPage
					variant="ticks"
					items={outline}
					active={spy.active}
					label={t.outline}
					onselect={(id) => spy.jump(id)}
				/>
			</div>
			<!-- Narrow: the strip the reading pages use, since a phone has no gutter. -->
			<div
				class="absolute inset-x-0 top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur @4xl/doc:hidden"
			>
				<OnThisPage
					variant="bar"
					items={outline}
					active={spy.active}
					label={t.outline}
					onselect={(id) => spy.jump(id)}
				/>
			</div>
		{/if}

		<div bind:this={scroller} class="thin-scrollbar h-full overflow-y-auto">
			<div
				class="mx-auto w-full max-w-[56rem] px-5 pb-40 @2xl/doc:px-8 {outline.length > 0
					? 'pt-[3.75rem] @4xl/doc:pt-14'
					: 'pt-8 @2xl/doc:pt-14'}"
			>
				<div
					class="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground"
				>
					{#if icon}{@render icon()}{:else}<FileText size={22} aria-hidden="true" />{/if}
				</div>

				<textarea
					bind:this={titleField}
					bind:value={title}
					oninput={() => ontitle?.(title)}
					onkeydown={onTitleKey}
					rows="1"
					spellcheck="false"
					aria-label={t.titlePlaceholder}
					placeholder={t.titlePlaceholder}
					class="doc-title mb-6 block w-full resize-none border-0 bg-transparent p-0 font-heading text-2xl leading-8 font-semibold tracking-tight text-foreground caret-brand outline-none focus-visible:shadow-none placeholder:text-muted-foreground/45"
				></textarea>

				<RichEditor
					{content}
					onchange={handleChange}
					variant="page"
					preset="full"
					placeholder=""
					minHeight="20rem"
					copyLinkLabel={t.copyLink}
					{oncopylink}
					bind:instance
				/>
			</div>
		</div>
	</div>
</div>

<style>
	/* The title grows with its text, so a long one wraps instead of scrolling sideways. */
	.doc-title {
		field-sizing: content;
		text-wrap: balance;
	}
</style>
