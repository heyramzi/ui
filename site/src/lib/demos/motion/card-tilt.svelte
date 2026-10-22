<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let tiltEl: HTMLElement | null = null;
	let tiltCard: HTMLElement | null = null;

	function tiltMove(event: PointerEvent) {
		if (!tiltEl || !tiltCard) return;
		const rect = tiltEl.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - rect.top) / rect.height;
		tiltCard.classList.add("is-tilting");
		tiltEl.classList.add("is-hover");
		tiltEl.style.setProperty("--tilt-rx", `${(0.5 - y) * 14}deg`);
		tiltEl.style.setProperty("--tilt-ry", `${(x - 0.5) * 14}deg`);
		tiltEl.style.setProperty("--tilt-gx", `${x * 100}%`);
		tiltEl.style.setProperty("--tilt-gy", `${y * 100}%`);
	}

	function tiltLeave() {
		if (!tiltEl || !tiltCard) return;
		tiltCard.classList.remove("is-tilting");
		tiltEl.classList.remove("is-hover");
		tiltEl.style.setProperty("--tilt-rx", "0deg");
		tiltEl.style.setProperty("--tilt-ry", "0deg");
	}
</script>

<DemoStage
	title="Card tilt"
	note="Pointer-tracked 3D tilt with a glare"
	importPath={"import '@heyramzi/ui/animations/card-tilt.css';"}
>
	<div bind:this={tiltEl} class="t-tilt" onpointermove={tiltMove} onpointerleave={tiltLeave}>
		<div bind:this={tiltCard} class="t-tilt-card tilt-card">
			<strong>Pro</strong>
			<span class="tilt-price">39 EUR</span>
			<span class="tilt-note">Move the pointer across the card.</span>
			<div class="t-tilt-glare"></div>
		</div>
	</div>
</DemoStage>

<style>
	.tilt-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 13rem;
		padding: 1.125rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		color: var(--td-text);
		font-size: 0.8125rem;
	}

	.tilt-price {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.tilt-note {
		color: var(--td-text-subtle);
	}
</style>
