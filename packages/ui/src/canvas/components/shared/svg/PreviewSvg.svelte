<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { penColorVar } from "#src/canvas/pen/colors.js";
	import type { PenPreview } from "#src/canvas/pen/pen-session.js";
	import { shapeOutline } from "#src/canvas/pen/shapes.js";
	import { HIGHLIGHTER_OPACITY } from "#src/canvas/pen/types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		preview: PenPreview | null;
		/** The xyflow viewport, so the preview lines up with the board. */
		viewport: { x: number; y: number; zoom: number };
	}

	// =========================
	// PROPS
	// =========================
	let { preview, viewport }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svg class="preview" aria-hidden="true">
	<g transform="translate({viewport.x} {viewport.y}) scale({viewport.zoom})">
		{#if preview?.kind === "stroke"}
			<path
				d={preview.d}
				fill={penColorVar(preview.color)}
				opacity={preview.tool === "highlighter" ? HIGHLIGHTER_OPACITY : 1}
			/>
		{:else if preview?.kind === "shape"}
			<g transform="translate({preview.box.x} {preview.box.y})">
				<path
					d={shapeOutline(preview.shape, preview.box.width, preview.box.height, 1.5)}
					fill="none"
					stroke={penColorVar(preview.color)}
					stroke-width="3"
					stroke-linejoin="round"
				/>
			</g>
		{:else if preview?.kind === "eraser"}
			<circle
				cx={preview.at.x}
				cy={preview.at.y}
				r={preview.radius}
				fill="none"
				stroke="var(--pen-ink, #1e1e1e)"
				stroke-width={1 / viewport.zoom}
				stroke-dasharray="3 2"
			/>
		{/if}
	</g>
</svg>

<style>
	.preview {
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}
</style>
