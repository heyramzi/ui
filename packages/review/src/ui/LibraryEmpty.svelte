<script lang="ts">
	import type { Snippet } from "svelte";

	/** A library with nothing to show: the search found nothing (and can be cleared), or the library itself is empty (the children say what to do). */
	let {
		query = "",
		onclear,
		children,
	}: { query?: string; onclear?: () => void; children?: Snippet } = $props();
</script>

<div class="none">
	{#if query.trim()}
		<p class="said">Nothing matches "{query.trim()}"</p>
		<button type="button" class="clear" onclick={onclear}>Clear search</button>
	{:else}
		<p class="said">{@render children?.()}</p>
	{/if}
</div>

<style>
	.none {
		display: grid;
		justify-items: start;
		gap: 10px;
		padding: 24px 0;
	}
	.said {
		margin: 0;
		color: var(--dim);
		font-size: var(--fs-sm);
	}
	.clear {
		min-height: var(--control, 32px);
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--raised);
		color: var(--text);
		font: inherit;
		font-size: var(--fs-xs);
		font-weight: 500;
		cursor: pointer;
		transition: border-color var(--duration-quick) var(--ease-smooth-out);
	}
	.clear:hover {
		border-color: var(--line-strong);
	}
	.clear:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
