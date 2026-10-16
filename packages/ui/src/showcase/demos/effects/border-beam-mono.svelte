<script lang="ts">
	import { BorderBeam } from "#src/index.js";
</script>

<BorderBeam size="sm" colorVariant="mono">
	<div class="card-inner">Small mono beam</div>
</BorderBeam>

<style>
	.card-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem 1rem;
		font-size: 0.875rem;
		color: var(--foreground);
		background: var(--card);
		border-radius: 0.5rem;
	}
</style>
