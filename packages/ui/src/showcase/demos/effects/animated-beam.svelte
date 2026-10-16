<script lang="ts">
	import { AnimatedBeam } from "#src/index.js";

	let container = $state<HTMLElement | null>(null);
	let from = $state<HTMLElement | null>(null);
	let to = $state<HTMLElement | null>(null);
</script>

<div bind:this={container} class="stage">
	<div bind:this={from} class="node">A</div>
	<div bind:this={to} class="node">B</div>
	{#if container && from && to}
		<AnimatedBeam
			containerRef={container}
			fromRef={from}
			toRef={to}
			fromAnchor="right"
			toAnchor="left"
			gradientStartColor="#6647F0"
			gradientStopColor="#22d3ee"
			pathColor="var(--muted-foreground)"
		/>
	{/if}
</div>

<style>
	.stage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 7rem;
		padding: 0 1.25rem;
	}
	.node {
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
	}
</style>
