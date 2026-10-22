<script lang="ts">
	import type { Snippet } from "svelte";

	/** A library group's heading, count and card grid. The studio's Animations library draws the same, so keep the two in step. */
	let {
		title,
		count,
		min = 220,
		children,
	}: { title: string; count: number; min?: number; children: Snippet } = $props();
</script>

<section class="lib-group">
	<h2>{title} <small>{count}</small></h2>
	<ul style:--min="{min}px">{@render children()}</ul>
</section>

<style>
	/* A host page may style every section with a gutter and a rule (the studio does), so the group clears both and sits on the page edge. */
	.lib-group {
		margin: 0;
		padding: 0;
		border: 0;
	}
	:global(.lib-group + .lib-group) {
		margin-top: 40px;
	}
	/* Scoped under the group, so it outranks the package's `.rv h2 { margin: 0 }` reset that otherwise eats the gap under the rule. */
	.lib-group h2 {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin: 0 0 14px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--line-soft);
		color: var(--text);
		font: 600 17px / 1.2 var(--display);
		letter-spacing: 0;
		text-transform: none;
	}
	h2 small {
		color: var(--faint);
		font-size: 12.5px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--min)), 1fr));
		gap: 16px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	/* The card: an edge, the surface, 16px inside. Both libraries put their own content in it. */
	ul > :global(li) {
		position: relative;
		display: grid;
		align-content: start;
		gap: 6px;
		min-width: 0;
		padding: 16px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
</style>
