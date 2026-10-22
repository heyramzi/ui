<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { SnapGuide } from "#src/canvas/headless/snap-guides.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		guides: SnapGuide[];
		/** Canvas zoom, so the line stays one screen pixel at every scale. */
		zoom: number;
	}

	// =========================
	// PROPS
	// =========================
	let { guides, zoom }: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let thickness = $derived(1 / Math.max(zoom, 0.05));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->

<!-- The line that justified the pull. It spans every card it lines up with, so
     the operator reads the relationship and not just a stray rule. -->
{#each guides as guide (guide.axis + ":" + guide.position)}
	<div
		class="snap-guide pointer-events-none absolute"
		style:left={guide.axis === "x" ? `${guide.position}px` : `${guide.start}px`}
		style:top={guide.axis === "y" ? `${guide.position}px` : `${guide.start}px`}
		style:width={guide.axis === "x" ? `${thickness}px` : `${guide.end - guide.start}px`}
		style:height={guide.axis === "y" ? `${thickness}px` : `${guide.end - guide.start}px`}
	></div>
{/each}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* One screen pixel is the right weight for a guide and too little to catch
	   the eye on an ink canvas, so the line carries its own halo. */
	.snap-guide {
		background: var(--cv-chrome-ring, #4a4ad8);
		box-shadow: 0 0 6px 1px color-mix(in oklch, var(--cv-chrome-ring, #4a4ad8) 55%, transparent);
		animation: snap-guide-in var(--duration-micro, 100ms) var(--ease-smooth-out, ease-out) both;
	}

	@keyframes snap-guide-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.snap-guide {
			animation-duration: 1ms;
		}
	}
</style>
