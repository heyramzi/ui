<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let digitGroup: HTMLElement | null = null;
	let digitAnimating = $state(false);
	let digitValue = $state("1234");

	function replayDigits() {
		if (!digitGroup) return;
		digitAnimating = false;
		digitValue = String(Math.floor(1000 + Math.random() * 8999));
		// WHY: force reflow so removing+re-adding .is-animating restarts the keyframes
		void digitGroup.offsetWidth;
		digitAnimating = true;
	}
</script>

<DemoStage
	title="Number pop-in"
	note="Digit flip with blur and stagger"
	importPath={"import '@heyramzi/ui/animations/digit-pop-in.css';"}
	onaction={replayDigits}
>
	<span
		bind:this={digitGroup}
		class="t-digit-group digit-display"
		class:is-animating={digitAnimating}
	>
		{#each digitValue.split("") as ch, i (i + ch)}
			<span class="t-digit" data-stagger={i}>{ch}</span>
		{/each}
	</span>
</DemoStage>

<style>
	.digit-display {
		font-size: 2.25rem;
		font-weight: 600;
		font-family: ui-monospace, SFMono-Regular, monospace;
		color: var(--td-text, var(--foreground));
		font-feature-settings: "tnum";
		letter-spacing: -0.02em;
	}
</style>
