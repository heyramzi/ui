<script lang="ts">
	import { AnimatedBeam } from "#src/index.js";

	let container = $state<HTMLElement | null>(null);
	let hub = $state<HTMLElement | null>(null);
	let sources = $state<HTMLElement[]>([]);

	const labels = ["1", "2", "3"];
	const colors = ["#7B68EE", "#22d3ee", "#10b981"];
</script>

<div bind:this={container} class="stage">
	<div class="col">
		{#each labels as label, i (label)}
			<div bind:this={sources[i]} class="node" style="border-color: {colors[i]}55">{label}</div>
		{/each}
	</div>
	<div class="hub-wrap">
		<div bind:this={hub} class="node hub">UI</div>
	</div>

	{#each labels as _, i (i)}
		{#if container && hub && sources[i]}
			<AnimatedBeam
				containerRef={container}
				fromRef={sources[i]}
				toRef={hub}
				fromAnchor="right"
				toAnchor="left"
				delay={i * 0.6}
				duration={4}
				gradientStartColor={colors[i]}
				gradientStopColor="#6647F0"
				pathColor="var(--muted-foreground)"
				pathOpacity={0.12}
			/>
		{/if}
	{/each}
</div>

<style>
	.stage {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 3rem;
		width: 100%;
		min-height: 9rem;
		padding: 0 1.25rem;
	}
	.col {
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.hub-wrap {
		z-index: 1;
		display: flex;
		justify-content: center;
	}
	.node {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.7rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
	}
	.hub {
		width: 3.25rem;
		height: 3.25rem;
		border-color: color-mix(in oklab, #6647f0 40%, transparent);
		box-shadow: 0 0 0 4px color-mix(in oklab, #6647f0 10%, transparent);
	}
</style>
