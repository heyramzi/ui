<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "./ring-chart.css";
	import type { Snippet } from "svelte";
	import { cn } from "@heyramzi/utils";
	import AnimatedValue from "./animated-value.svelte";

	// =========================
	// TYPES
	// =========================
	type RingData = {
		label: string;
		value: number;
		/** Denominator for the progress arc. */
		maxValue: number;
		/** CSS color or var. Falls back to --chart-1..5. */
		color?: string;
	};

	interface Props {
		data: RingData[];
		/** Fixed square size in px. Omit to fill the parent (responsive). */
		size?: number;
		/** Ring thickness in viewBox units. */
		strokeWidth?: number;
		/** Gap between concentric rings in viewBox units. */
		ringGap?: number;
		/** Inner radius of the innermost ring in viewBox units. */
		baseInnerRadius?: number;
		lineCap?: "round" | "butt";
		/** Center label when nothing is hovered. */
		defaultLabel?: string;
		formatValue?: (v: number) => string;
		/** Animate arcs on mount. */
		animate?: boolean;
		/** Glow the hovered ring. */
		showGlow?: boolean;
		/** Hovered ring index, bindable for legend hover-sync. */
		hoveredIndex?: number | null;
		onHoverChange?: (index: number | null) => void;
		minWidth?: number;
		ariaLabel?: string;
		/** Replaces the center readout, for a number that isn't the ring's own value. */
		children?: Snippet;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		data,
		size,
		strokeWidth = 11,
		ringGap = 6,
		baseInnerRadius = 48,
		lineCap = "round",
		defaultLabel = "Total",
		formatValue = (v) => v.toLocaleString(),
		animate = true,
		showGlow = true,
		hoveredIndex = $bindable(null),
		onHoverChange,
		minWidth = 170,
		ariaLabel,
		children,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	const rings = $derived.by(() =>
		data.map((d, i) => {
			const radius = baseInnerRadius + i * (strokeWidth + ringGap) + strokeWidth / 2;
			const progress = d.maxValue > 0 ? Math.max(0, Math.min(1, d.value / d.maxValue)) : 0;
			return {
				...d,
				index: i,
				radius,
				progress,
				color: d.color ?? `var(--chart-${(i % 5) + 1})`,
			};
		}),
	);
	const maxRadius = $derived(
		rings.length ? rings[rings.length - 1].radius + strokeWidth / 2 : baseInnerRadius,
	);
	const vb = $derived(maxRadius * 2 + 4);
	const center = $derived(vb / 2);
	const total = $derived(data.reduce((sum, d) => sum + d.value, 0));
	const hoveredRing = $derived(hoveredIndex != null ? (rings[hoveredIndex] ?? null) : null);

	// =========================
	// FUNCTIONS
	// =========================
	function setHover(index: number | null) {
		hoveredIndex = index;
		onHoverChange?.(index);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class={cn("hr-ring", className)}
	class:glow={showGlow}
	style:width={size ? `${size}px` : "100%"}
	style:min-width="{minWidth}px"
	role="img"
	aria-label={ariaLabel ?? `${defaultLabel}: ${formatValue(total)}`}
>
	<!-- no-inline-svg-ignore -->
	<svg viewBox="0 0 {vb} {vb}" aria-hidden="true">
		<g transform="rotate(-90 {center} {center})">
			{#each rings as ring (ring.index)}
				<circle
					class="track"
					cx={center}
					cy={center}
					r={ring.radius}
					fill="none"
					stroke={ring.color}
					stroke-width={strokeWidth}
				/>
			{/each}
			{#each rings as ring (ring.index)}
				{@const dimmed = hoveredIndex !== null && hoveredIndex !== ring.index}
				<circle
					class="fill"
					role="presentation"
					class:animate
					cx={center}
					cy={center}
					r={ring.radius}
					pathLength="100"
					fill="none"
					stroke={ring.color}
					stroke-width={strokeWidth}
					stroke-linecap={lineCap}
					style:stroke-dashoffset={100 - ring.progress * 100}
					style:opacity={dimmed ? 0.25 : 1}
					style:animation-delay="{160 + ring.index * 120}ms"
					style:--ring-color={ring.color}
					onmouseenter={() => setHover(ring.index)}
					onmouseleave={() => setHover(null)}
				></circle>
			{/each}
		</g>
	</svg>

	<div class="center" class:custom={children}>
		{#if children}
			{@render children()}
		{:else}
			<span class="value">
				<AnimatedValue value={hoveredRing ? hoveredRing.value : total} format={formatValue} />
			</span>
			{#key hoveredRing?.label ?? defaultLabel}
				<span class="label">{hoveredRing ? hoveredRing.label : defaultLabel}</span>
			{/key}
		{/if}
	</div>
</div>
