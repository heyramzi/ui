<svelte:options namespace="svg" />

<script lang="ts">
// =========================
// IMPORTS
// =========================
import { BaseEdge } from "@xyflow/svelte";
import EdgeGradient from "#src/canvas/edges/edge-gradient.svelte";

// =========================
// TYPES
// =========================
interface Props {
	id: string;
	path: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	fromColor: string;
	toColor?: string;
	markerEnd?: string;
	/** The edge's own style. A stroke set here beats the gradient. */
	style?: string;
	class?: string;
}

// =========================
// PROPS
// =========================
let { id, path, from, to, fromColor, toColor = fromColor, markerEnd, style = "", class: className = "" }: Props = $props();

// =========================
// DERIVED
// =========================
let gradientId = $derived(`canvas-gradient-${id.replace(/[^\w-]/g, "_")}`);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<EdgeGradient id={gradientId} {from} {to} {fromColor} {toColor} />
<BaseEdge {id} {path} {markerEnd} class="canvas-edge {className}" style="stroke: url(#{gradientId}); {style}" />
<!-- Hidden until a test run crosses this link; the canvas stylesheet draws the moving dashes. -->
<path d={path} class="canvas-edge-flow" fill="none" aria-hidden="true" />
