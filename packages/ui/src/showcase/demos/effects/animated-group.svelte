<script lang="ts">
	import { AnimatedGroup } from "#src/index.js";

	const rows = ["Audit", "Blueprint", "Build", "Handover"];
	let run = $state(0);
</script>

<div class="stage">
	{#key run}
		<AnimatedGroup class="list" preset="blur-slide" stagger={70} onMount>
			{#each rows as row (row)}
				<span class="pill">{row}</span>
			{/each}
		</AnimatedGroup>
	{/key}
	<button onclick={() => run++}>Replay</button>
</div>

<style>
	.stage {
		display: grid;
		gap: 0.75rem;
		justify-items: start;
		padding: 1rem;
	}
	.stage :global(.list) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.pill {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	button {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}
</style>
