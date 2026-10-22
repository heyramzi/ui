<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/canvas/pen/pen.css";
	import PreviewSvg from "#src/canvas/components/shared/svg/PreviewSvg.svelte";
	import type { ErasableNode } from "#src/canvas/pen/eraser.js";
	import type { PenOp } from "#src/canvas/pen/ops.js";
	import { createPenSession, type PenPreview } from "#src/canvas/pen/pen-session.js";
	import type { PenColor, PenTool } from "#src/canvas/pen/types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		tool: PenTool;
		color?: PenColor;
		/** Brush width in flow units. Unset takes the tool's default. */
		size?: number;
		/** The xyflow viewport, so screen pixels map to flow units. */
		viewport: { x: number; y: number; zoom: number };
		nodes: readonly ErasableNode[];
		commit: (ops: PenOp[]) => void;
		startGesture: () => () => void;
		onTextPlaced?: (nodeId: string) => void;
	}

	// =========================
	// PROPS
	// =========================
	let {
		tool,
		color = "ink",
		size,
		viewport,
		nodes,
		commit,
		startGesture,
		onTextPlaced,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let layer = $state<HTMLDivElement | null>(null);
	let preview = $state<PenPreview | null>(null);
	const session = createPenSession(
		{
			getNodes: () => nodes,
			commit: (ops) => commit(ops),
			startGesture: () => startGesture(),
			onTextPlaced: (id) => onTextPlaced?.(id),
			onPreview: (next) => {
				preview = next;
			},
		},
		() => ({ tool, color, size, zoom: viewport.zoom }),
	);

	// =========================
	// EFFECTS
	// =========================
	// Switching tool mid-stroke unmounts the overlay, and an open gesture would block undo for good.
	$effect(() => () => session.cancel());

	// =========================
	// FUNCTIONS
	// =========================
	function toFlow(event: { clientX: number; clientY: number }) {
		const rect = layer?.getBoundingClientRect();
		const left = rect?.left ?? 0;
		const top = rect?.top ?? 0;
		return {
			x: (event.clientX - left - viewport.x) / viewport.zoom,
			y: (event.clientY - top - viewport.y) / viewport.zoom,
		};
	}

	function pressureOf(event: PointerEvent): number | undefined {
		return event.pointerType === "pen" ? event.pressure : undefined;
	}

	function onpointerdown(event: PointerEvent) {
		// A second finger or a right click mustn't start a stroke.
		if (event.button !== 0 || !event.isPrimary) return;
		layer?.setPointerCapture(event.pointerId);
		session.down(toFlow(event), pressureOf(event));
	}

	function onpointermove(event: PointerEvent) {
		if (!session.active) return;
		// Coalesced events keep a fast pen stroke smooth between animation frames.
		const batch = event.getCoalescedEvents?.() ?? [];
		for (const sample of batch.length > 0 ? batch : [event]) {
			session.move(toFlow(sample), pressureOf(sample));
		}
	}

	function onpointerup(event: PointerEvent) {
		if (!session.active) return;
		layer?.releasePointerCapture(event.pointerId);
		session.up(toFlow(event), { square: event.shiftKey });
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === "Escape") session.cancel();
	}

	// The overlay sits above xyflow's zoom pane, so a wheel or a trackpad pinch would
	// never reach it. Hand those to the pane so you can zoom and pan mid-drawing.
	function forwardWheel(node: HTMLElement) {
		const handler = (event: WheelEvent) => {
			const zoomPane = node.closest(".svelte-flow")?.querySelector(".svelte-flow__zoom");
			if (!zoomPane) return;
			event.preventDefault();
			zoomPane.dispatchEvent(
				new WheelEvent("wheel", {
					deltaX: event.deltaX,
					deltaY: event.deltaY,
					deltaZ: event.deltaZ,
					deltaMode: event.deltaMode,
					clientX: event.clientX,
					clientY: event.clientY,
					screenX: event.screenX,
					screenY: event.screenY,
					ctrlKey: event.ctrlKey,
					shiftKey: event.shiftKey,
					altKey: event.altKey,
					metaKey: event.metaKey,
					bubbles: true,
					cancelable: true,
				}),
			);
		};
		node.addEventListener("wheel", handler, { passive: false });
		return () => node.removeEventListener("wheel", handler);
	}

	function cursorFor(current: PenTool): string {
		if (current === "text") return "text";
		return "crosshair";
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svelte:window {onkeydown} />

<div
	bind:this={layer}
	{@attach forwardWheel}
	class="pen-overlay"
	style:cursor={cursorFor(tool)}
	role="presentation"
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	onpointercancel={() => session.cancel()}
>
	<PreviewSvg {preview} {viewport} />
</div>

<style>
	.pen-overlay {
		position: absolute;
		inset: 0;
		z-index: 5;
		touch-action: none;
		user-select: none;
	}
</style>
