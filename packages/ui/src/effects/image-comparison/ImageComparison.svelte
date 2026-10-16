<script lang="ts" module>
	import type { Snippet } from "svelte";

	/** One side of the comparison. `sources` turns the image into a `<picture>`. */
	export interface ComparisonImage {
		src: string;
		alt: string;
		/** Modern formats tried before `src`, such as an AVIF with the PNG as the fallback. */
		sources?: readonly { srcset: string; type: string }[];
		/** Intrinsic size, so the browser reserves the frame before the image lands. */
		width?: number;
		height?: number;
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/image-comparison/ImageComparison.css";
	import { cn } from "@heyramzi/utils";
	import { untrack } from "svelte";
	import { positionAt } from "#src/effects/image-comparison/compare.js";

	// =========================
	// TYPES
	// =========================
	interface ImageComparisonProps {
		/** Image shown on the left of the handle. */
		before: ComparisonImage;
		/** Image shown on the right of the handle. */
		after: ComparisonImage;
		/** Handle position, 0-100. Bind it to read it or to move the handle from outside. */
		position?: number;
		/** Track the pointer without a press. The handle returns to where it began. */
		hover?: boolean;
		/**
		 * Positions the handle visits once on mount, then it returns to where it began.
		 * It stops for good at the first touch. Tells a visitor the frame moves.
		 */
		hint?: readonly number[];
		/** Load both images now, ahead of the rest of the page. For a frame above the fold. */
		eager?: boolean;
		/** Label announced for the slider. */
		label?: string;
		/** A label drawn over the left side, such as "Before". */
		beforeBadge?: Snippet;
		/** A label drawn over the right side, such as "After". */
		afterBadge?: Snippet;
		/** Which edge the badges sit on. */
		badgeEdge?: "top" | "bottom";
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		before,
		after,
		position = $bindable(50),
		hover = false,
		hint,
		eager = false,
		label = "Compare before and after",
		beforeBadge,
		afterBadge,
		badgeEdge = "bottom",
		class: className,
	}: ImageComparisonProps = $props();

	// =========================
	// STATE
	// =========================
	// WHY: the handle's first position is where `hover` and `hint` bring it back to.
	const rest = untrack(() => position);
	let dragging = $state(false);
	let hinting = $state(false);
	let touched = $state(false);

	// =========================
	// EFFECTS
	// =========================
	const HINT_DELAY = 800;
	const HINT_STEP = 900;

	$effect(() => {
		const steps = hint;
		if (touched || !steps?.length) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const timers: ReturnType<typeof setTimeout>[] = [];
		hinting = true;
		[...steps, rest].forEach((stop, index) => {
			timers.push(
				setTimeout(
					() => {
						position = stop;
					},
					HINT_DELAY + index * HINT_STEP,
				),
			);
		});
		timers.push(
			setTimeout(
				() => {
					hinting = false;
				},
				HINT_DELAY + steps.length * HINT_STEP + HINT_STEP / 2,
			),
		);
		return () => {
			timers.forEach(clearTimeout);
			hinting = false;
		};
	});

	// =========================
	// FUNCTIONS
	// =========================
	// WHY: the effect reads `touched`, so setting it runs the effect's cleanup and cancels the timers.
	function touch() {
		touched = true;
	}

	function trackPointer(event: PointerEvent) {
		if (!hover && !dragging) return;
		const rect =
			event.currentTarget instanceof HTMLElement && event.currentTarget.getBoundingClientRect();
		if (!rect) return;
		position = positionAt(event.clientX, rect.left, rect.width);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet picture(side: ComparisonImage, cls: string)}
	{#if side.sources?.length}
		<picture>
			{#each side.sources as source (source.type)}
				<source srcset={source.srcset} type={source.type} />
			{/each}
			{@render img(side, cls)}
		</picture>
	{:else}
		{@render img(side, cls)}
	{/if}
{/snippet}

{#snippet img(side: ComparisonImage, cls: string)}
	<img
		class={cls}
		src={side.src}
		alt={side.alt}
		width={side.width}
		height={side.height}
		draggable="false"
		loading={eager ? "eager" : undefined}
		fetchpriority={eager ? "high" : undefined}
	/>
{/snippet}

<div
	role="group"
	aria-label={label}
	class={cn("hr-compare", className)}
	style="--hr-compare-pos:{position}"
	data-eased={dragging ? undefined : ""}
	data-hinting={hinting ? "" : undefined}
	data-badges={badgeEdge}
	onpointermove={trackPointer}
	onpointerdown={() => {
		dragging = true;
		touch();
	}}
	onpointerup={() => (dragging = false)}
	onpointercancel={() => (dragging = false)}
	onpointerleave={() => {
		dragging = false;
		if (hover) position = rest;
	}}
	onkeydown={touch}
>
	{@render picture(before, "hr-compare__img")}
	{@render picture(after, "hr-compare__img hr-compare__img--after")}
	{#if beforeBadge}
		<div class="hr-compare__badge hr-compare__badge--before">{@render beforeBadge()}</div>
	{/if}
	{#if afterBadge}
		<div class="hr-compare__badge hr-compare__badge--after">{@render afterBadge()}</div>
	{/if}
	<input
		class="hr-compare__range"
		type="range"
		min="0"
		max="100"
		step="1"
		aria-label={label}
		bind:value={position}
	/>
	<div class="hr-compare__handle">
		<span class="hr-compare__grip">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polyline points="10 6 4 12 10 18"></polyline>
				<polyline points="14 6 20 12 14 18"></polyline>
			</svg>
		</span>
	</div>
</div>
