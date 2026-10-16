<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { getChartContext } from "layerchart";

	// =========================
	// TYPES
	// =========================
	type Props = {
		/** Gradient id. Paint the highlight line with `stroke: url(#id)`. */
		id: string;
	};

	// =========================
	// PROPS
	// =========================
	let { id }: Props = $props();

	const ctx = getChartContext();
</script>

<!-- =========================== -->
<!-- CROSSHAIR -->
<!-- =========================== -->
<!-- WHY userSpaceOnUse: a vertical line has a zero-width bounding box, so an
     objectBoundingBox gradient on it paints nothing. -->
<defs>
	<linearGradient {id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={ctx.height}>
		<stop offset="0" class="hr-crosshair-stop" stop-opacity="0" />
		<stop offset="0.12" class="hr-crosshair-stop" />
		<stop offset="0.88" class="hr-crosshair-stop" />
		<stop offset="1" class="hr-crosshair-stop" stop-opacity="0" />
	</linearGradient>
</defs>
