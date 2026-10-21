<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { SketchPath } from "#src/canvas/headless/sketch.js";

// =========================
// TYPES
// =========================
interface Props {
	rule: SketchPath[];
	ink: string;
	width: number;
}

// =========================
// PROPS
// =========================
let { rule, ink, width }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svg class="pen-rule" {width} height="10" aria-hidden="true">
	{#each rule as path, i (i)}
		<path class="pen-line" style:--sw={path.strokeWidth} d={path.d} fill="none" stroke={ink} stroke-width={path.strokeWidth} stroke-linecap="round" />
	{/each}
</svg>

<style>
	.pen-rule {
		display: block;
		overflow: visible;
		pointer-events: none;
	}
</style>
