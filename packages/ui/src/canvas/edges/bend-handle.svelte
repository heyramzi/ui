<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { useStore } from "@xyflow/svelte";

	// The grab dot on a selected elbow, one size on screen. Only the edge showing it reads the zoom; a root value restyles every card per frame.

	// =========================
	// CONSTANTS
	// =========================
	const MIN_ZOOM = 0.05;

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The way the run moves: x slides it sideways, y up and down. */
		axis: "x" | "y";
		title: string;
		onpointerdown: (event: PointerEvent) => void;
		ondblclick: () => void;
	}

	// =========================
	// PROPS
	// =========================
	let { axis, title, onpointerdown, ondblclick }: Props = $props();

	// =========================
	// STATE
	// =========================
	const store = useStore();

	// =========================
	// DERIVED
	// =========================
	let unzoom = $derived(1 / Math.max(store.viewport.zoom, MIN_ZOOM));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<button
	type="button"
	class="cv-bend-handle"
	class:cv-bend-x={axis === "x"}
	data-edge-bend
	{title}
	aria-label={title}
	style:scale={unzoom}
	{onpointerdown}
	{ondblclick}
></button>

<!-- =========================== -->
<!-- STYLES -->
<!-- =========================== -->
<style>
	.cv-bend-handle {
		display: block;
		box-sizing: border-box;
		width: 12px;
		height: 12px;
		padding: 0;
		border: 2px solid var(--cv-chrome-surface, var(--background, #fff));
		border-radius: 9999px;
		background: var(--cv-chrome-ring, var(--ring, #4a4ad8));
		cursor: row-resize;
		touch-action: none;
	}

	.cv-bend-x {
		cursor: col-resize;
	}
</style>
