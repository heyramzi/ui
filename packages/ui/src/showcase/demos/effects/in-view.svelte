<script lang="ts">
	import { InView } from "#src/index.js";

	const blocks = [1, 2, 3, 4];
</script>

<div class="scroller">
	<p class="hint">Scroll this panel.</p>
	{#each blocks as n (n)}
		<InView preset="slide" amount={0.4} once={false} class="block">
			{#snippet children()}
				<span>Block {n}</span>
			{/snippet}
		</InView>
	{/each}
</div>

<style>
	.scroller {
		display: grid;
		gap: 0.75rem;
		height: 11rem;
		overflow-y: auto;
		padding: 0.75rem;
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
