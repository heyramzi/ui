<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { EDGE_FADE_DEFAULT } from "./edge-fade.js";

	// =========================
	// TYPES
	// =========================
	type Props = {
		/** Mask id. Apply it to the shape with `mask="url(#id)"`. */
		id: string;
		/** Fraction of the shape's width faded at each side, 0-0.45. */
		amount?: number;
	};

	// =========================
	// PROPS
	// =========================
	let { id, amount = EDGE_FADE_DEFAULT }: Props = $props();

	// =========================
	// DERIVED
	// =========================
	const stop = $derived(Math.min(0.45, Math.max(0, amount)));
</script>

<!-- =========================== -->
<!-- EDGE FADE -->
<!-- =========================== -->
<!-- WHY: the fill gradient of an area is vertical, so the horizontal fade cannot ride on it. A luminance mask in objectBoundingBox units needs no pixel -->
<!-- dimensions: the ramp is expressed as a fraction of the masked path's own box, so it follows the plot width through every resize. -->
<defs>
	<linearGradient id="{id}-ramp" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#fff" stop-opacity="0" />
		<stop offset={stop} stop-color="#fff" stop-opacity="1" />
		<stop offset={1 - stop} stop-color="#fff" stop-opacity="1" />
		<stop offset="1" stop-color="#fff" stop-opacity="0" />
	</linearGradient>
	<mask {id} maskContentUnits="objectBoundingBox">
		<rect x="0" y="0" width="1" height="1" fill="url(#{id}-ramp)" />
	</mask>
</defs>
