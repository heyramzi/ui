<script lang="ts">
	import { TextEffect } from "@heyramzi/ui/effects/reveal";

	let run = $state(0);
</script>

<div class="flex flex-col items-center gap-2">
	{#key run}
		<TextEffect
			text="Components for our product teams."
			class="text-center text-2xl font-semibold tracking-tight"
			onMount
		/>
		<TextEffect
			text="Ship the thing."
			per="char"
			preset="blur-slide"
			as="h3"
			class="text-xl font-semibold"
			onMount
		/>
		<TextEffect
			text="Every primitive is CSS, no runtime."
			preset="fade"
			delay={400}
			class="text-[13px] text-muted-foreground"
			onMount
		/>
	{/key}
	<button
		type="button"
		onclick={() => run++}
		class="mt-2 rounded-lg border border-border bg-card px-2.5 py-1 text-xs">Replay</button
	>
</div>
