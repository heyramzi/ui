<script lang="ts">
// =========================
// IMPORTS
// =========================
import { roughEllipse, roughPolygon, roughRect, seedFrom, sketchColors } from "#src/canvas/headless/sketch.js";
import { penColorVar } from "#src/canvas/pen/colors.js";
import type { ShapeData } from "#src/canvas/pen/types.js";

// =========================
// TYPES
// =========================
interface Props {
	shape: ShapeData;
	outline: string;
	ink: string;
	width?: number;
	height?: number;
	/** Draw the outline with the hand instead of the exact path. */
	hand?: boolean;
	/** Seeds the hand, so a shape keeps its wobble between renders. */
	seed?: string;
}

// =========================
// PROPS
// =========================
let { shape, outline, ink, width, height, hand = false, seed = "" }: Props = $props();

let wash = $derived(shape.fill ? penColorVar(shape.fill) : ink);

let rough = $derived.by(() => {
	const w = width ?? 0;
	const h = height ?? 0;
	if (!hand || w < 4 || h < 4) return [];
	const pen = { seed: seedFrom(seed), colors: { ...sketchColors("ink", false), stroke: ink } };
	if (shape.shape === "ellipse") return roughEllipse(w, h, pen);
	if (shape.shape === "diamond") {
		return roughPolygon([[w / 2, 1], [w - 1, h / 2], [w / 2, h - 1], [1, h / 2]], pen);
	}
	return roughRect(w, h, pen);
});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svg class="pen-shape" {width} {height} viewBox="0 0 {width} {height}" aria-hidden="true">
	{#if rough.length > 0}
		{#if shape.filled}
			<path d={outline} fill={wash} fill-opacity="0.12" stroke="none" pointer-events="all" />
		{/if}
		{#each rough as path, i (i)}
			<path class="pen-line" style:--sw={shape.strokeWidth} d={path.d} fill="none" stroke={ink} stroke-width={shape.strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
		{/each}
	{:else}
	<path
		class="pen-line"
		style:--sw={shape.strokeWidth}
		d={outline}
		fill={shape.filled ? wash : "none"}
		fill-opacity={shape.filled ? 0.12 : 0}
		stroke={ink}
		stroke-width={shape.strokeWidth}
		stroke-linejoin="round"
		pointer-events={shape.filled ? "all" : "stroke"}
	/>
	{/if}
</svg>

<style>
	.pen-shape {
		display: block;
		overflow: visible;
		pointer-events: none;
	}
</style>
