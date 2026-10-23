<script lang="ts">
	import { AnimatedGroup } from "@heyramzi/ui/effects/reveal";

	const rows = ["Audit", "Blueprint", "Build", "Handover"];
	let run = $state(0);
</script>

<div class="flex flex-col items-start gap-3">
	{#key run}
		<AnimatedGroup class="flex flex-wrap gap-2" preset="blur-slide" stagger={70} onMount>
			{#each rows as row (row)}
				<span class="rounded-full border border-border bg-card px-3 py-1.5 text-xs">{row}</span>
			{/each}
		</AnimatedGroup>
	{/key}
	<button
		type="button"
		onclick={() => run++}
		class="rounded-lg border border-border bg-card px-2.5 py-1 text-xs">Replay</button
	>
</div>
