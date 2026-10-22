<script lang="ts">
	import { swapText } from "@heyramzi/ui/animations/text-swap";
	import DemoStage from "#lib/DemoStage.svelte";

	let target: HTMLElement | null = null;
	const phrases = [
		"Build the system.",
		"Ship the route.",
		"Verify the output.",
		"Repeat tomorrow.",
	];
	let cursor = 0;

	function nextPhrase() {
		if (!target) return;
		cursor = (cursor + 1) % phrases.length;
		swapText(target, phrases[cursor]);
	}
</script>

<DemoStage
	title="Text states swap"
	note="Text swap with translate and blur"
	importPath={"import { swapText } from '@heyramzi/ui/animations/text-swap';"}
	onaction={nextPhrase}
>
	<span bind:this={target} class="phrase">{phrases[0]}</span>
</DemoStage>

<style>
	.phrase {
		font-size: 1.0625rem;
		font-weight: 500;
		color: var(--td-text, var(--foreground));
		--text-swap-dur: 240ms;
	}
</style>
