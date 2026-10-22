<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
	import successCheck from "#lib/demos/motion/success-check.svg?raw";

	let checkEl: HTMLElement | null = null;

	$effect(() => {
		const checkPath = checkEl?.querySelector("path");
		if (!checkPath) return;
		const len = Math.ceil(checkPath.getTotalLength());
		checkPath.style.strokeDasharray = String(len);
		checkPath.style.strokeDashoffset = String(len);
	});

	function replayCheck() {
		if (!checkEl) return;
		checkEl.setAttribute("data-state", "out");
		// WHY: force reflow so the appear keyframes restart from offset 0
		void checkEl.offsetWidth;
		checkEl.setAttribute("data-state", "in");
	}
</script>

<DemoStage
	title="Success check"
	note="Fade, rotate, bob, and stroke draw"
	importPath={"import '@heyramzi/ui/animations/success-check.css';"}
	onaction={replayCheck}
>
	<div class="check-badge">
		<span bind:this={checkEl} class="t-success-check" data-state="in" aria-hidden="true">
			{@html successCheck}
		</span>
	</div>
</DemoStage>

<style>
	.check-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: oklch(0.66 0.16 155);
		color: #fff;
	}
	.check-badge :global(.t-success-check svg) {
		width: 2.25rem;
		height: 2.25rem;
	}
</style>
