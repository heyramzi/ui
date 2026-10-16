<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface ShowcaseSectionProps {
		/** Anchor id. Must match the ShowcaseSectionMeta the nav rail was given. */
		id: string;
		label: string;
		/** What the section is for, in the reader's terms, not a list of its members. */
		lead?: string;
		/** Live demos. Stacked one per row unless `bare` is set. */
		children?: Snippet;
		/** Skip the stack, for content that brings a layout of its own. */
		bare?: boolean;
		/** Everything in the section with no demo, drawn as rows under the stack. */
		listed?: Snippet;
	}
</script>

<script lang="ts">
	let { id, label, lead, children, listed, bare = false }: ShowcaseSectionProps = $props();
</script>

<section {id}>
	<div class="sc-section-head">
		<h2>{label}</h2>
		{#if lead}
			<p>{lead}</p>
		{/if}
	</div>

	{#if children}
		{#if bare}
			{@render children()}
		{:else}
			<div class="sc-stack">
				{@render children()}
			</div>
		{/if}
	{/if}

	{#if listed}
		<div class="sc-section-listed">
			{@render listed()}
		</div>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		/* Clears the sticky controls row, whose height the page declares once. */
		scroll-margin-top: calc(var(--showcase-nav-top, 0px) + 4.5rem);
	}

	/*
	 * WHY the heading sits on its own rule rather than on whitespace: the page is
	 */

	/*
	 * one long column of stages now, and a gap alone did not read as a boundary once the stages themselves had air inside them.
	 */
	.sc-section-head {
		display: flex;
		flex-direction: column;
		gap: 0.3125rem;
		margin-top: 2.25rem;
		padding: 2.25rem 0 1.25rem;
		border-top: 1px solid var(--color-border, var(--border));
	}

	section:first-child .sc-section-head {
		margin-top: 0;
		padding-top: 1.5rem;
		border-top: 0;
	}

	h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.014em;
		color: var(--color-foreground, var(--foreground));
	}

	p {
		margin: 0;
		max-width: 62ch;
		font-size: 0.8125rem;
		line-height: 1.55;
		color: var(--color-muted-foreground, var(--muted-foreground));
		text-wrap: pretty;
	}

	/*
	 * One stage per row. A grid of narrow cards made every component the size of the smallest one on the page, which is the opposite of what a showcase is
	 */

	/*
	 * for: a table and a button both got 20rem, and only one of them survived it.
	 */
	.sc-stack {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sc-section-listed {
		padding-top: 1rem;
	}
</style>
