<script lang="ts">
	import type { Zoom } from "#src/hooks/zoom.svelte.js";
	import { decodePeaks } from "#src/ui/peaks.js";

	let { src, duration, time, zoom }: { src: string; duration: number; time: number; zoom: Zoom } =
		$props();

	let canvas = $state<HTMLCanvasElement>();
	let peaks = $state.raw<Float32Array | null>(null);
	let loaded = $state(false);
	let theme = $state(0);

	// A new src is a new cut, so the old lane goes and the new one is decoded.
	$effect(() => {
		const control = new AbortController();
		peaks = null;
		loaded = false;
		void decodePeaks(src, control.signal).then((found) => {
			if (control.signal.aborted) return;
			peaks = found;
			loaded = true;
		});
		return () => control.abort();
	});

	// The lane paints in CSS colours, so a theme switch has to paint it again.
	$effect(() => {
		const bump = () => (theme += 1);
		const dark = matchMedia("(prefers-color-scheme: dark)");
		const watch = new MutationObserver(bump);
		watch.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme", "class"],
		});
		dark.addEventListener("change", bump);
		return () => {
			watch.disconnect();
			dark.removeEventListener("change", bump);
		};
	});

	const loudest = $derived.by(() => {
		let max = 0;
		for (const value of peaks ?? []) max = Math.max(max, value);
		return max;
	});

	// WHY: the canvas is one screen wide and follows the scroll, so a zoom of 400px a second never builds a huge bitmap.
	$effect(() => {
		void theme;
		if (!canvas) return;
		const dpr = window.devicePixelRatio || 1;
		const w = zoom.width;
		const h = canvas.clientHeight;
		if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		const railW = zoom.railW;
		if (!peaks || !duration || !loudest || railW === 0) return;
		const css = getComputedStyle(canvas);
		const count = peaks.length;
		const at = (x: number) => Math.floor(((x + zoom.scroll) / railW) * count);
		const played = (time / duration) * railW - zoom.scroll;
		const end = Math.min(w, railW - zoom.scroll);
		for (let x = 0; x < end; x += 2) {
			const from = Math.max(0, at(x));
			const to = Math.min(peaks.length, Math.max(from + 1, at(x + 2)));
			let max = 0;
			for (let i = from; i < to; i++) max = Math.max(max, peaks[i] ?? 0);
			const bar = Math.max(1, (max / loudest) * h * 0.92);
			ctx.fillStyle = x < played ? css.outlineColor : css.color;
			ctx.fillRect(x, (h - bar) / 2, 1.5, bar);
		}
	});
</script>

<canvas
	bind:this={canvas}
	class="wave"
	class:ready={!!peaks}
	style:width="{zoom.width}px"
	data-state={!loaded ? "loading" : peaks ? "ready" : "empty"}
	aria-hidden="true"
></canvas>

<style>
	.wave {
		position: sticky;
		left: 0;
		display: block;
		height: 100%;
		color: var(--faint);
		outline-color: var(--accent);
		opacity: 0;
		transition: opacity var(--duration-fast) var(--ease-smooth-out);
	}
	.wave.ready {
		opacity: 1;
	}
</style>
