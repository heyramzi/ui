<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/progressive-blur/ProgressiveBlur.css";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	type Direction = "top" | "right" | "bottom" | "left";

	interface ProgressiveBlurProps {
		/** Edge the blur builds towards. Default `bottom`. */
		direction?: Direction;
		/** Stacked masked layers. More layers, smoother ramp, more compositing. */
		layers?: number;
		/** Blur added per layer, in px. */
		intensity?: number;
		class?: string;
	}

	// =========================
	// CONSTANTS
	// =========================
	const ANGLES: Record<Direction, number> = { top: 0, right: 90, bottom: 180, left: 270 };

	// =========================
	// PROPS
	// =========================
	let {
		direction = "bottom",
		layers = 8,
		intensity = 0.25,
		class: className,
	}: ProgressiveBlurProps = $props();

	// =========================
	// DERIVED
	// =========================
	// WHY: one uniform backdrop-filter banks up hard at its edge. Overlapping
	// windowed masks, each blurred a little more, ramp it instead.
	let steps = $derived(
		Array.from({ length: Math.max(layers, 2) }, (_, i) => {
			const size = 100 / (layers + 1);
			const stops = [i, i + 1, i + 2, i + 3]
				.map((n, at) => `rgb(255 255 255 / ${at === 1 || at === 2 ? 1 : 0}) ${n * size}%`)
				.join(", ");
			const mask = `linear-gradient(${ANGLES[direction]}deg, ${stops})`;
			const blur = `blur(${i * intensity}px)`;
			return `mask-image:${mask};-webkit-mask-image:${mask};backdrop-filter:${blur};-webkit-backdrop-filter:${blur}`;
		}),
	);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("hr-progressive-blur", className)} aria-hidden="true">
	{#each steps as step, i (i)}
		<div class="hr-progressive-blur__layer" style={step}></div>
	{/each}
</div>
