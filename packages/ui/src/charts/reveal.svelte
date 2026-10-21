<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { getChartContext } from "layerchart";
	import { onMount, type Snippet } from "svelte";
	import { expoInOut } from "svelte/easing";
	import { prefersReducedMotion, Tween } from "svelte/motion";
	import { REVEAL_MS, tokenMs } from "#src/charts/motion.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		children: Snippet;
		/** Headroom around the plot so a stroke at the series max is not cut. */
		bleed?: number;
	};

	// =========================
	// PROPS
	// =========================
	let { children, bleed = 6 }: Props = $props();

	// =========================
	// STATE
	// =========================
	const ctx = getChartContext();
	const id = `hr-reveal-${Math.random().toString(36).slice(2, 8)}`;
	const progress = new Tween(0, { easing: expoInOut });
	let rect = $state<SVGRectElement>();

	// =========================
	// LIFECYCLE
	// =========================
	onMount(() => {
		const duration =
			prefersReducedMotion.current || !rect ? 0 : tokenMs(rect, "--chart-motion-reveal", REVEAL_MS);
		progress.set(1, { duration });
	});
</script>

<!-- =========================== -->
<!-- REVEAL -->
<!-- =========================== -->
<!-- WHY a tweened width and not scaleX: scaleX needs a transform origin, and the
     rect has to keep tracking the plot width through a resize. -->
<defs>
	<clipPath {id}>
		<rect
			bind:this={rect}
			x={-bleed}
			y={-bleed}
			width={Math.max(0, (ctx.width + bleed * 2) * progress.current)}
			height={ctx.height + bleed * 2}
		/>
	</clipPath>
</defs>
<g clip-path="url(#{id})">
	{@render children()}
</g>
