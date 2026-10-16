<script lang="ts">
	import ProgressiveBlur from "@heyramzi/ui/effects/progressive-blur";
</script>

<div class="frame">
	<div class="grid">
		{#each Array(48) as _, i (i)}
			<span class="cell"></span>
		{/each}
	</div>
	<ProgressiveBlur class="fade" direction="bottom" layers={10} intensity={0.6} />
	<span class="label">Progressive blur</span>
</div>

<style>
	.frame {
		position: relative;
		height: 9rem;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 0.25rem;
		padding: 0.5rem;
	}
	.cell {
		height: 1.5rem;
		background: var(--card);
		border-radius: 0.25rem;
	}
	.frame :global(.fade) {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 60%;
	}
	.label {
		position: absolute;
		bottom: 0.625rem;
		left: 0.75rem;
		font-size: 0.75rem;
		color: var(--foreground);
	}
</style>
