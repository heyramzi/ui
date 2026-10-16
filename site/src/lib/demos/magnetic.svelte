<script lang="ts">
	import { magnetic } from "@heyramzi/ui/effects/magnetic";
</script>

<div class="stage">
	<button class="cta" use:magnetic={{ intensity: 0.5, range: 130 }}>Book a call</button>
	<p class="hint">Move the pointer near the button.</p>
</div>

<style>
	.stage {
		display: grid;
		gap: 0.75rem;
		place-items: center;
		padding: 2rem 1rem;
	}
	.cta {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
</style>
