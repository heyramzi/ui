<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Component, Snippet } from "svelte";
	import { untrack } from "svelte";
	import DocPage from "#src/components/docs/doc-page.svelte";
	import type { DocHeading } from "#src/components/docs/scroll-spy.svelte.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		title: string;
		/** Breadcrumb, as a reader would say it: "Marketing / Reports". */
		section?: string;
		/** Already worded and localised: "Updated 30 Jul 2026". */
		updated?: string;
		icon?: Component<{
			class?: string;
			weight?: "bold";
			"aria-hidden"?: boolean | "true" | "false";
		}>;
		actions?: Snippet;
		/** The body's h2s, anchored by id, for the "On this page" rail. */
		headings?: DocHeading[];
		contentsLabel: string;
		/** The rendered body. Trusted HTML from the consumer's own parser, never user input. */
		html: string;
		/** Changes when another document is shown: the pane returns to the top and the body re-enters. */
		resetKey: string;
		measure?: "prose" | "wide";
		/** Runs on the body after every swap (icons, diagrams). Returns its cleanup. */
		enhance?: (root: HTMLElement) => void | (() => void);
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		title,
		section,
		updated,
		icon,
		actions,
		headings = [],
		contentsLabel,
		html,
		resetKey,
		measure = "prose",
		enhance,
		class: className = "",
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let body = $state<HTMLElement | null>(null);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		void html;
		const root = body;
		if (!root || !enhance) return;
		return untrack(() => enhance(root)) ?? undefined;
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- Inline, not framed: a link is an ordinary anchor, so the router swaps only this body. -->
<DocPage
	{title}
	{section}
	{updated}
	{icon}
	{actions}
	{headings}
	{contentsLabel}
	{resetKey}
	{measure}
>
	{#key resetKey}
		<div bind:this={body} class="document-view t-enter {className}">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, parsed server-side -->
			{@html html}
		</div>
	{/key}
</DocPage>

<!-- =========================== -->
<!-- STYLES -->
<!-- =========================== -->
<!-- In the components layer at zero specificity, so a consumer's own document stylesheet wins without !important. -->
<style>
	@layer theme, base, components, utilities;

	@layer components {
		:global {
			:where(.document-view) {
				color: var(--color-foreground);
				font-size: 0.9375rem;
				line-height: 1.65;
				overflow-wrap: anywhere;
			}
			:where(.document-view) :where(h1, h2, h3, h4) {
				font-family: var(--font-heading);
				color: var(--color-foreground);
				line-height: 1.25;
				text-wrap: balance;
				scroll-margin-top: 6rem;
			}
			:where(.document-view) :where(h1:first-child) {
				display: none;
			}
			:where(.document-view) :where(h2) {
				margin: 2.5rem 0 0.75rem;
				font-size: 1.25rem;
				font-weight: 700;
				letter-spacing: -0.01em;
			}
			:where(.document-view) :where(h3) {
				margin: 1.75rem 0 0.5rem;
				font-size: 1rem;
				font-weight: 600;
			}
			:where(.document-view) > :where(:first-child, h1:first-child + *) {
				margin-top: 0;
			}
			:where(.document-view) :where(p, ul, ol, blockquote, pre, table) {
				margin: 0 0 1rem;
			}
			:where(.document-view) :where(ul, ol) {
				padding-left: 1.25rem;
			}
			:where(.document-view) :where(li + li) {
				margin-top: 0.25rem;
			}
			:where(.document-view) :where(a) {
				color: var(--color-brand);
				text-decoration: underline;
				text-decoration-color: color-mix(in oklch, currentColor 35%, transparent);
				text-underline-offset: 0.16em;
				transition: text-decoration-color var(--duration-fast) ease-out;
			}
			@media (hover: hover) and (pointer: fine) {
				:where(.document-view) :where(a:hover) {
					text-decoration-color: currentColor;
				}
			}
			/* A wikilink to a page that does not exist yet reads as text, not as a dead link. */
			:where(.document-view) :where(.wikilink.missing, a.missing) {
				color: var(--color-muted-foreground);
				text-decoration-style: dashed;
			}
			:where(.document-view) :where(code) {
				font-family: var(--font-mono);
				font-size: 0.85em;
				padding: 0.1em 0.35em;
				border-radius: var(--radius-sm, 0.375rem);
				background: var(--color-muted);
			}
			:where(.document-view) :where(pre) {
				overflow-x: auto;
				padding: 0.875rem 1rem;
				border: 1px solid var(--color-border);
				border-radius: var(--radius-lg);
				background: var(--color-muted);
				font-size: 0.8125rem;
				line-height: 1.55;
			}
			:where(.document-view) :where(pre code) {
				padding: 0;
				background: none;
				font-size: inherit;
			}
			:where(.document-view) :where(blockquote) {
				padding: 0.75rem 1rem;
				border-radius: var(--radius-md);
				background: var(--color-muted);
				color: var(--color-muted-foreground);
			}
			:where(.document-view) :where(blockquote > :last-child) {
				margin-bottom: 0;
			}
			:where(.document-view) :where(.callout) {
				margin: 0 0 1rem;
				padding: 0.75rem 1rem;
				border: 1px solid var(--color-border);
				border-radius: var(--radius-lg);
				background: var(--color-card);
			}
			:where(.document-view) :where(table) {
				display: block;
				max-width: 100%;
				overflow-x: auto;
				border-collapse: collapse;
				font-size: 0.875rem;
				font-variant-numeric: tabular-nums;
			}
			:where(.document-view) :where(th, td) {
				padding: 0.5rem 0.75rem;
				border-bottom: 1px solid var(--color-border);
				text-align: left;
				vertical-align: top;
			}
			:where(.document-view) :where(th) {
				font-weight: 600;
				color: var(--color-muted-foreground);
			}
			:where(.document-view) :where(hr) {
				margin: 2rem 0;
				border: 0;
				border-top: 1px solid var(--color-border);
			}
			:where(.document-view) :where(img) {
				max-width: 100%;
				height: auto;
				border-radius: var(--radius-md);
			}
			@media (prefers-reduced-motion: reduce) {
				:where(.document-view) :where(a) {
					transition: none;
				}
			}
		}
	}
</style>
