<script lang="ts">
// =========================
// IMPORTS
// =========================
import { useStore } from "@xyflow/svelte";
import { frameRect, type FrameRect } from "#src/canvas/editor/frame.js";
import "#src/canvas/ui/canvas-ui.css";
import { forwardWheel } from "#src/canvas/ui/forward-wheel.js";

// =========================
// TYPES
// =========================
interface Props {
	/** A drag ended, or a click: the box in flow units. */
	onFrame: (rect: FrameRect) => void;
}

// =========================
// PROPS
// =========================
let { onFrame }: Props = $props();

// =========================
// STATE
// =========================
// The layer maps screen pixels to flow units, so it reads the live xyflow viewport.
const store = useStore();
let layer = $state<HTMLDivElement | null>(null);
let start = $state<{ x: number; y: number } | null>(null);
let end = $state<{ x: number; y: number } | null>(null);

// =========================
// DERIVED
// =========================
let preview = $derived(start && end ? frameRect(start, end) : null);

// =========================
// FUNCTIONS
// =========================
function toFlow(event: { clientX: number; clientY: number }) {
	const box = layer?.getBoundingClientRect();
	const { x, y, zoom } = store.viewport;
	return {
		x: (event.clientX - (box?.left ?? 0) - x) / zoom,
		y: (event.clientY - (box?.top ?? 0) - y) / zoom,
	};
}

function onpointerdown(event: PointerEvent) {
	if (event.button !== 0 || !event.isPrimary) return;
	layer?.setPointerCapture(event.pointerId);
	start = end = toFlow(event);
}

function onpointermove(event: PointerEvent) {
	if (start) end = toFlow(event);
}

function onpointerup(event: PointerEvent) {
	if (!start) return;
	layer?.releasePointerCapture(event.pointerId);
	const rect = frameRect(start, toFlow(event));
	start = end = null;
	onFrame(rect);
}

function cancel() {
	start = end = null;
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svelte:window onkeydown={(event) => event.key === "Escape" && cancel()} />

<div
	bind:this={layer}
	{@attach forwardWheel}
	class="cv-frame-layer"
	data-testid="frame-layer"
	role="presentation"
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	onpointercancel={cancel}
>
	{#if preview}
		<div
			class="cv-frame-preview"
			style:left="{preview.x * store.viewport.zoom + store.viewport.x}px"
			style:top="{preview.y * store.viewport.zoom + store.viewport.y}px"
			style:width="{preview.width * store.viewport.zoom}px"
			style:height="{preview.height * store.viewport.zoom}px"
		></div>
	{/if}
</div>

<style>
	.cv-frame-layer {
		position: absolute;
		inset: 0;
		z-index: 5;
		cursor: crosshair;
		touch-action: none;
		user-select: none;
	}

	.cv-frame-preview {
		position: absolute;
		border: 1.5px solid var(--cv-selection);
		border-radius: var(--cv-radius-btn);
		background: var(--cv-selection-fill);
		pointer-events: none;
	}
</style>
