<script lang="ts">
	import { TextEffect } from "#src/index.js";

	let run = $state(0);
</script>

<div class="stage">
	{#key run}
		<TextEffect
			text="Ship the thing."
			per="char"
			preset="blur-slide"
			as="h3"
			class="line"
			onMount
		/>
		<TextEffect
			text="Every primitive is CSS, no runtime."
			preset="fade"
			delay={400}
			class="sub"
			onMount
		/>
	{/key}
	<button onclick={() => run++}>Replay</button>
</div>

<style>
	.stage {
		display: grid;
		gap: 0.5rem;
		justify-items: start;
		padding: 1rem;
	}
	.stage :global(.line) {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--foreground);
	}
	.stage :global(.sub) {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}
	button {
		margin-top: 0.5rem;
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}
</style>
