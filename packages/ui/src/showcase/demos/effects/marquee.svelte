<script lang="ts">
	import { Marquee } from "#src/index.js";

	const items = ["Design", "Build", "Ship", "Measure", "Learn", "Repeat"];
</script>

<div class="stage">
	<Marquee pauseOnHover duration="18s">
		{#each items as item (item)}
			<span class="pill">{item}</span>
		{/each}
	</Marquee>
</div>

<style>
	.stage {
		width: 100%;
		-webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
		mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
	}
	.pill {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		white-space: nowrap;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
</style>
