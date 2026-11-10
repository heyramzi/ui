<script lang="ts">
	import { InView, onInView } from "@heyramzi/ui/effects/reveal";

	const blocks = [1, 2, 3, 4];
	let seen = $state(false);
</script>

<!-- A keyboard can only scroll a region it can focus (axe scrollable-region-focusable). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="scroller" role="region" aria-label="Blocks" tabindex="0">
	<p class="hint">Scroll this panel.</p>
	{#each blocks as n (n)}
		<InView preset="slide" amount={0.4} once={false} class="block">
			{#snippet children()}
				<span>Block {n}</span>
			{/snippet}
		</InView>
	{/each}
	<p class="hint" use:onInView={{ amount: 0.6, onEnter: () => (seen = true) }}>
		{seen ? "The onInView action fired." : "Keep scrolling."}
	</p>
</div>

<style>
	.scroller {
		display: grid;
		gap: 0.75rem;
		height: 11rem;
		overflow-y: auto;
		padding: 0.75rem;
		border-radius: 0.75rem;
	}
	.scroller:focus-visible {
		outline: none;
		box-shadow: var(--ring-focus-inset);
	}
	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.scroller :global(.block) {
		display: grid;
		place-items: center;
		min-height: 4.5rem;
		font-size: 0.8125rem;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
	}
</style>
