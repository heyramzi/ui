<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/image-comparison/ImageComparison.css";
	import { cn } from "@heyramzi/utils";
	import { untrack } from "svelte";

	// =========================
	// TYPES
	// =========================
	interface ImageComparisonProps {
		/** Image shown on the left of the handle. */
		before: { src: string; alt: string };
		/** Image shown on the right of the handle. */
		after: { src: string; alt: string };
		/** Handle position at rest, 0-100. */
		start?: number;
		/** Track the pointer without a press. */
		hover?: boolean;
		/** Label announced for the slider. */
		label?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		before,
		after,
		start = 50,
		hover = false,
		label = "Compare before and after",
		class: className,
	}: ImageComparisonProps = $props();

	// =========================
	// STATE
	// =========================
	// WHY: `start` seeds the handle and then stops mattering; the pointer and the
	// range own the position from there.
	let position = $state(untrack(() => start));
	let dragging = $state(false);

	// =========================
	// FUNCTIONS
	// =========================
	function trackPointer(event: PointerEvent) {
		if (!hover && !dragging) return;
		const rect =
			event.currentTarget instanceof HTMLElement && event.currentTarget.getBoundingClientRect();
		if (!rect) return;
		position = Math.min(Math.max(((event.clientX - rect.left) / rect.width) * 100, 0), 100);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	role="group"
	aria-label={label}
	class={cn("hr-compare", className)}
	style="--hr-compare-pos:{position}"
	data-eased={dragging ? undefined : ""}
	onpointermove={trackPointer}
	onpointerdown={() => (dragging = true)}
	onpointerup={() => (dragging = false)}
	onpointerleave={() => {
		dragging = false;
		if (hover) position = start;
	}}
>
	<img class="hr-compare__img" src={before.src} alt={before.alt} draggable="false" />
	<img
		class="hr-compare__img hr-compare__img--after"
		src={after.src}
		alt={after.alt}
		draggable="false"
	/>
	<input
		class="hr-compare__range"
		type="range"
		min="0"
		max="100"
		step="0.1"
		aria-label={label}
		bind:value={position}
	/>
	<div class="hr-compare__handle"><span class="hr-compare__grip">◀▶</span></div>
</div>
