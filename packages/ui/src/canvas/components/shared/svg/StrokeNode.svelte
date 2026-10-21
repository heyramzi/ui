<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { NodeProps } from "@xyflow/svelte";
import "#src/canvas/pen/pen.css";
import { penColorVar } from "#src/canvas/pen/colors.js";
import { strokePath } from "#src/canvas/pen/stroke-path.js";
import { HIGHLIGHTER_OPACITY, type StrokeData } from "#src/canvas/pen/types.js";

// =========================
// PROPS
// =========================
let { data, selected, width, height }: NodeProps = $props();

// =========================
// DERIVED
// =========================
let stroke = $derived(data as StrokeData);
let path = $derived(strokePath(stroke.points, stroke));
// A wide, invisible line along the centre so a thin stroke is easy to click.
let hitPoints = $derived(stroke.points.map((point) => `${point[0]},${point[1]}`).join(" "));
let hitWidth = $derived(Math.max(stroke.size, 14));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svg
	class="pen-stroke"
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	aria-hidden="true"
>
	<polyline
		class="hit"
		points={hitPoints}
		fill="none"
		stroke="transparent"
		stroke-width={hitWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<!-- Selected, the ink's own outline widens it about 1.7x (pen.css --select-stroke); no box. -->
	<path
		class="ink"
		d={path}
		fill={penColorVar(stroke.color)}
		stroke={selected ? penColorVar(stroke.color) : "none"}
		stroke-width={selected ? stroke.size * 0.7 : 0}
		stroke-linejoin="round"
		opacity={stroke.tool === "highlighter" ? HIGHLIGHTER_OPACITY : 1}
	/>
</svg>

<style>
	.pen-stroke {
		display: block;
		overflow: visible;
		pointer-events: none;
	}
	.hit {
		pointer-events: stroke;
	}
	.ink {
		pointer-events: visiblePainted;
	}
</style>
