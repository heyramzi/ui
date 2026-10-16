<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { getChartContext } from "layerchart";
	import type { Snippet } from "svelte";
	import { prefersReducedMotion, Spring } from "svelte/motion";
	import { fade } from "svelte/transition";
	import { HOVER_BAND_REACH, hoverBand } from "#src/charts/hover-band.js";

	// =========================
	// TYPES
	// =========================
	type Props = {
		/** The series: dims while a point is hovered. */
		children: Snippet;
		/** The strokes alone, redrawn at full strength around the hovered point. */
		segment: Snippet;
		/** Headroom above and below the plot so a thick stroke is not cut. */
		bleed?: number;
		/** How far the band reaches each side of the point, as a share of the gap to its neighbour. */
		reach?: number;
	};

	// =========================
	// PROPS
	// =========================
	let { children, segment, bleed = 6, reach = HOVER_BAND_REACH }: Props = $props();

	// =========================
	// STATE
	// =========================
	const ctx = getChartContext();
	const id = `hr-focus-${Math.random().toString(36).slice(2, 8)}`;
	const left = new Spring(0, { stiffness: 0.2, damping: 0.85 });
	const width = new Spring(0, { stiffness: 0.2, damping: 0.85 });

	// =========================
	// DERIVED
	// =========================
	const band = $derived.by(() => {
		const d = ctx.tooltip.data;
		const xs = (ctx.data as unknown[]).map((r) => Number(ctx.xGet(r)));
		// WHY by x and not indexOf: ctx.data hands back proxies, so identity never matches.
		const at = d ? Number(ctx.xGet(d)) : NaN;
		return hoverBand(xs, xs.indexOf(at), ctx.width, reach);
	});
	const duration = $derived(prefersReducedMotion.current ? 0 : 400);

	// =========================
	// EFFECTS
	// =========================
	// WHY instant on first hover: the clip should open where the pointer is, not
	// slide in from wherever it last closed.
	let wasOn = false;
	$effect(() => {
		if (!band) {
			wasOn = false;
			return;
		}
		const instant = !wasOn || prefersReducedMotion.current;
		left.set(band.x, { instant });
		width.set(band.width, { instant });
		wasOn = true;
	});
</script>

<!-- =========================== -->
<!-- HOVER FOCUS -->
<!-- =========================== -->
<g class="hr-hover-dim" class:hr-hover-dimmed={band !== null}>
	{@render children()}
</g>
<!-- WHY outside the if: the segment fades out after hover ends, and without its
     clip it would flash as the whole line. -->
<defs>
	<clipPath {id}>
		<rect x={left.current} y={-bleed} width={width.current} height={ctx.height + bleed * 2} />
	</clipPath>
</defs>
{#if band}
	<g clip-path="url(#{id})" transition:fade={{ duration }}>
		{@render segment()}
	</g>
{/if}
