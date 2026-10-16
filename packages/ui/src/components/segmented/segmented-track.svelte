<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { cn } from "@heyramzi/utils";
import { segmentedTrackClass } from "#src/components/segmented/segmented.js";
import { slidingPill } from "#src/lib/sliding-pill.js";

// =========================
// TYPES
// =========================
type Props = {
	/** Fill the row rather than sit at its natural width. */
	fill?: boolean;
	class?: string;
	children: Snippet;
	/**
	 * A last segment that isn't an item: today the overflow trigger. It's inside
	 * the track but outside the ARIA container, so a `tablist` owns only tabs.
	 */
	after?: Snippet;
	// What the ARIA shapes differ by: `role`/`aria-label` for the filter, nothing
	// for the nav (its <nav> has it), bits-ui's wiring for tabs.
	[key: string]: unknown;
};

// =========================
// PROPS
// =========================
let {
	fill = false,
	class: className,
	children,
	after,
	...rest
}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY its own component: the active segment is a travelling pill, and the
     pill needs one element inside the track that no caller can forget. -->
<div {...rest} class={cn("track relative", segmentedTrackClass({ fill }), className)}>
	<!-- Renders at zero width until the attachment measures, so a server-rendered
	     strip shows the segment's own background and never an empty pill. -->
	<span class="pill" aria-hidden="true" {@attach slidingPill}></span>
	{@render children()}
	{@render after?.()}
</div>

<!-- =========================== -->
<!-- STYLES -->
<!-- =========================== -->
<style>
	/* Inset separators keep the strip one bordered object. */
	.track :global(.ui-segment)::before {
		content: "";
		position: absolute;
		top: 22%;
		bottom: 22%;
		left: 0;
		width: 1px;
		background-color: var(--color-border);
		transition: opacity var(--duration-fast) var(--ease-smooth-out);
		pointer-events: none;
	}

	.track :global(.pill + .ui-segment)::before,
	.track :global([data-slot="tabs-list"] > .ui-segment:first-child)::before {
		display: none;
	}

	/* The highlight and hover wash hide the seams on either side. */
	.track :global(.ui-segment[data-state="active"])::before,
	.track :global(.ui-segment[aria-current="page"])::before,
	.track :global(.ui-segment[aria-pressed="true"])::before,
	.track :global(.ui-segment[data-state="active"] + .ui-segment)::before,
	.track :global(.ui-segment[aria-current="page"] + .ui-segment)::before,
	.track :global(.ui-segment[aria-pressed="true"] + .ui-segment)::before,
	.track :global([data-slot="tabs-list"]:has(> .ui-segment:last-child[data-state="active"]) + .ui-segment)::before,
	.track :global(.ui-segment:hover)::before,
	.track :global(.ui-segment:hover + .ui-segment)::before {
		opacity: 0;
	}

	/* The label's colour lands with the pill, on the same fast step. */
	.track :global(.ui-segment) {
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			color var(--duration-fast) var(--ease-smooth-out),
			transform var(--duration-micro) var(--ease-smooth-out);
	}

	/* A faint wash in the well says which segment the pointer would pick. */
	@media (hover: hover) {
		.track
			:global(
				.ui-segment:hover:not([data-state="active"], [aria-current="page"], [aria-pressed="true"], [data-state="open"])
			) {
			background-color: color-mix(in oklch, var(--color-muted) 55%, transparent);
		}
	}

	.pill {
		position: absolute;
		top: 2px;
		bottom: 2px;
		left: 0;
		z-index: 0;
		width: 0;
		opacity: 0;
		/* Concentric with the border and the 2px inset. */
		border-radius: calc(var(--radius-lg) - 3px);
		background-color: var(--color-muted);
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--color-foreground) 6%, transparent);
		transform: translateX(0);
		/* transitions-dev `16-tabs-sliding`: the fast step, 250ms. */
		transition:
			transform var(--duration-fast) var(--ease-smooth-out),
			width var(--duration-fast) var(--ease-smooth-out),
			opacity var(--duration-quick) var(--ease-smooth-out);
		will-change: transform, width;
		pointer-events: none;
	}

	/* Before the attachment measures, the active segment draws the pill itself,
	   so a server-rendered strip is right before any JS arrives. */
	.track:not([data-pill="on"]) :global(:is([data-state="active"], [aria-current="page"], [aria-pressed="true"])) {
		background-color: var(--color-muted);
		box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--color-foreground) 6%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.pill {
			transition: opacity var(--duration-quick) var(--ease-smooth-out);
		}

		.track :global(.ui-segment) {
			transition: none;
		}
	}
</style>
