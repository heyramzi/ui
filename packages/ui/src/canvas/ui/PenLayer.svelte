<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { useStore } from "@xyflow/svelte";
	import type { ErasableNode } from "#src/canvas/pen/eraser.js";
	import type { PenOp } from "#src/canvas/pen/ops.js";
	import PenOverlay from "#src/canvas/pen/PenOverlay.svelte";
	import type { PenColor, PenTool } from "#src/canvas/pen/types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		tool: PenTool;
		color: PenColor;
		size?: number;
		nodes: readonly ErasableNode[];
		commit: (ops: PenOp[]) => void;
		startGesture: () => () => void;
		onTextPlaced?: (nodeId: string) => void;
	}

	// =========================
	// PROPS
	// =========================
	let { tool, color, size, nodes, commit, startGesture, onTextPlaced }: Props = $props();

	// =========================
	// STATE
	// =========================
	// The overlay maps screen pixels to flow units, so it reads the live xyflow viewport.
	const store = useStore();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<PenOverlay
	{tool}
	{color}
	{size}
	viewport={store.viewport}
	{nodes}
	{commit}
	{startGesture}
	{onTextPlaced}
/>
