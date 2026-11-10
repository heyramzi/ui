<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import {
		segmentedTrackClass,
		type SegmentedVariant,
	} from "#src/components/segmented/segmented.js";
	import { slidingPill } from "#src/lib/sliding-pill.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Fill the row rather than sit at its natural width. */
		fill?: boolean;
		/** `pill`, a grey track with a white thumb that slides, or `underline`, a travelling rule. */
		variant?: SegmentedVariant;
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
	}

	// =========================
	// PROPS
	// =========================
	let {
		fill = false,
		variant = "pill",
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
<div
	{...rest}
	data-variant={variant}
	class={cn("track relative", segmentedTrackClass({ variant, fill }), className)}
>
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
	@layer theme, base, components, utilities;

	@layer components {
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
					.ui-segment:hover:not(
							[data-state="active"],
							[aria-current="page"],
							[aria-pressed="true"],
							[data-state="open"]
						)
				) {
				background-color: color-mix(in oklch, var(--color-foreground) 5%, transparent);
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
			/* The white thumb on the grey track. Concentric: the track's control radius less its
			   2px inset. The resting button shadow lifts it; no border, so no seam to fight. */
			border-radius: calc(var(--radius-lg) - 2px);
			background-color: var(--color-card);
			box-shadow: var(--elev-btn), var(--elev-hairline);
			transform: translateX(0);
			/* transitions-dev `16-tabs-sliding`: the fast step, 250ms. */
			transition:
				transform var(--duration-fast) var(--ease-smooth-out),
				width var(--duration-fast) var(--ease-smooth-out),
				opacity var(--duration-quick) var(--ease-smooth-out);
			will-change: transform;
			pointer-events: none;
		}

		/* Before the attachment measures, the active segment draws the pill itself,
		   so a server-rendered strip is right before any JS arrives. */
		.track:not([data-pill="on"])
			:global(:is([data-state="active"], [aria-current="page"], [aria-pressed="true"])) {
			background-color: var(--color-card);
			box-shadow: var(--elev-btn), var(--elev-hairline);
		}

		/* On dark the card is the darker surface, so the thumb lifts toward the text instead. */
		:global(.dark) .pill,
		:global(.dark)
			.track:not([data-pill="on"])
			:global(:is([data-state="active"], [aria-current="page"], [aria-pressed="true"])) {
			background-color: color-mix(in oklch, var(--color-foreground) 14%, var(--color-card));
		}

		/* The underline: no wash, and the pill becomes a 2px rule on the
		   hairline. `--segmented-rule` lets a brand colour it from a class. */
		@media (hover: hover) {
			.track[data-variant="underline"]
				:global(
					.ui-segment:hover:not(
							[data-state="active"],
							[aria-current="page"],
							[aria-pressed="true"],
							[data-state="open"]
						)
				) {
				background-color: transparent;
			}
		}

		.track[data-variant="underline"] .pill {
			top: auto;
			bottom: -1px;
			height: 2px;
			border-radius: 1px;
			background-color: var(--segmented-rule, var(--color-foreground));
			box-shadow: none;
		}

		.track[data-variant="underline"]:not([data-pill="on"])
			:global(:is([data-state="active"], [aria-current="page"], [aria-pressed="true"])) {
			background-color: transparent;
			box-shadow: inset 0 -2px 0 var(--segmented-rule, var(--color-foreground));
		}

		/* On a coarse pointer the well grows to 44px and its segments are the hit area, since a
		   clipped well can't hold one hanging outside it. */
		@media (any-pointer: coarse) {
			.track[data-variant="pill"]::after {
				content: "";
				position: absolute;
				inset: 0;
				z-index: 2;
				border: 1px solid var(--color-border);
				border-radius: inherit;
				pointer-events: none;
			}

			.track[data-variant="pill"] .pill {
				top: 3px;
				bottom: 3px;
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.pill {
				transition: opacity var(--duration-quick) var(--ease-smooth-out);
			}

			.track :global(.ui-segment) {
				transition: none;
			}
		}
	}
</style>
