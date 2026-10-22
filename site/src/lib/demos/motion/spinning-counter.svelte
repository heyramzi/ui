<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let reelEl: HTMLElement | null = null;

	/** One column per digit, each clipping a 0-9 strip it spins past. */
	function spinReel(value = "482") {
		const reel = reelEl;
		if (!reel) return;
		reel.replaceChildren();
		value.split("").forEach((digit, index) => {
			const col = document.createElement("div");
			col.className = "t-reel-col";
			const strip = document.createElement("div");
			strip.className = "t-reel-strip";
			for (let n = 0; n < 30; n++) {
				const cell = document.createElement("div");
				cell.className = "t-reel-digit";
				cell.textContent = String(n % 10);
				strip.append(cell);
			}
			col.append(strip);
			reel.append(col);
			const cells = 20 + Number(digit);
			strip.style.transform = "translateY(0)";
			strip.style.filter = "blur(0px)";
			void strip.offsetHeight;
			strip.style.transition = `transform var(--reel-dur) var(--reel-ease) ${index * 90}ms, filter var(--reel-dur) linear ${index * 90}ms`;
			strip.style.transform = `translateY(calc(var(--reel-cell) * -${cells}))`;
		});
	}

	// Runs on its own: the counter spins to its first value on mount.
	$effect(() => {
		spinReel();
	});
</script>

<DemoStage
	title="Spinning counter"
	note="One reel per digit, staggered landing"
	importPath={"import '@heyramzi/ui/animations/spinning-counter.css';"}
	onaction={() => spinReel(String(100 + Math.floor(Math.random() * 900)))}
>
	<div bind:this={reelEl} class="t-reel reel-demo"></div>
</DemoStage>

<style>
	.reel-demo {
		font-size: 2rem;
		font-weight: 600;
		font-family: ui-monospace, SFMono-Regular, monospace;
		color: var(--td-text);
	}
</style>
