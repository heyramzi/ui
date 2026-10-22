<script module lang="ts">
	// WHY: each gradient needs a document-unique <defs> id; a module counter keeps
	// SSR and hydration in lockstep (def and ref share the same value per render).
	let gradientSeq = 0;
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/gauge-chart.css";
	import { cn } from "#src/lib/utils.js";
	import AnimatedValue from "#src/charts/animated-value.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Arc fill, 0-100 (how many notches light up). */
		value: number;
		/** "gauge" = notched arc, "ring" = continuous swept arc. */
		variant?: "gauge" | "ring";
		/** Show the center value/label. Off when the number sits beside the gauge. */
		showValue?: boolean;
		/** Active arc color (CSS color or var). Alias for `activeFill`. */
		color?: string;
		/** Single-hue gradient along the active arc. Alias for `useGradient`. */
		gradient?: boolean;
		/** Center label under the value. Alias for `defaultLabel`. */
		label?: string;
		/** Center statistic. Defaults to `value`. Formatted via `formatOptions`. */
		centerValue?: number;
		/** Notch count around the arc. */
		totalNotches?: number;
		/** Gap between notches as a percentage of the arc. */
		spacing?: number;
		/** Radial depth of the notch band as a percentage of the default. */
		notchLengthPercent?: number;
		/** Corner fillet in viewBox units (0 = sharp). Defaults to a soft pill. */
		notchCornerRadius?: number;
		/** Rectangular notches instead of angular/tapered. */
		uniformWidth?: boolean;
		/** Arc start in degrees (default 135, sweeping to 405 = 270deg with a bottom gap). */
		startAngle?: number;
		endAngle?: number;
		/** Single-hue gradient along the active arc instead of a flat fill. */
		useGradient?: boolean;
		/** Hex stops for the active gradient. Defaults to a tonal ramp of `activeFill`. */
		activeGradient?: [string, string];
		/** Active notch color (CSS color or var). */
		activeFill?: string;
		/** Track notch color. Defaults to `activeFill`. */
		inactiveFill?: string;
		activeFillOpacity?: number;
		inactiveFillOpacity?: number;
		/** Center label under the value. */
		defaultLabel?: string;
		/** Intl formatting for the center value. */
		formatOptions?: Intl.NumberFormatOptions;
		locale?: string;
		prefix?: string;
		suffix?: string;
		/** Fixed square size in px. Omit to fill the parent (responsive). */
		size?: number;
		/** Minimum width when responsive. */
		minWidth?: number;
		/** Accessible description, e.g. "ARR run rate". */
		ariaLabel?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		value,
		variant = "gauge",
		showValue = true,
		color,
		gradient,
		label,
		centerValue,
		totalNotches = 40,
		spacing = 25,
		notchLengthPercent = 100,
		notchCornerRadius,
		uniformWidth = false,
		startAngle = 135,
		endAngle = 405,
		useGradient = false,
		activeGradient,
		activeFill = "var(--chart-1)",
		inactiveFill,
		activeFillOpacity = 1,
		inactiveFillOpacity = 0.12,
		defaultLabel = "Total",
		formatOptions,
		locale,
		prefix,
		suffix,
		size,
		minWidth = 160,
		ariaLabel,
		class: className,
	}: Props = $props();

	// =========================
	// CONST
	// =========================
	// Normalized 100x100 coordinate space so the SVG scales to any container.
	const CX = 50;
	const CY = 50;
	const OUTER_R = 42;
	const gradientId = `hr-gauge-grad-${(gradientSeq += 1)}`;

	// =========================
	// DERIVED
	// =========================
	const clamped = $derived(Math.max(0, Math.min(100, value)));
	const center = $derived(centerValue ?? value);
	const effFill = $derived(color ?? activeFill);
	const effGradient = $derived(gradient ?? useGradient);
	const effLabel = $derived(label ?? defaultLabel);
	const band = $derived(14 * (Math.max(5, Math.min(100, notchLengthPercent)) / 100));
	const innerR = $derived(OUTER_R - band);
	const midR = $derived((OUTER_R + innerR) / 2);
	const corner = $derived(notchCornerRadius ?? band * 0.22);
	const totalAngle = $derived(endAngle - startAngle);
	const activeCount = $derived(Math.round((clamped / 100) * totalNotches));
	const trackFill = $derived(inactiveFill ?? effFill);
	const activePaint = $derived(effGradient ? `url(#${gradientId})` : effFill);
	const gradStops = $derived(
		activeGradient ?? [`color-mix(in oklab, ${effFill}, white 45%)`, effFill],
	);
	// WHY: ring variant draws a single rounded arc that sweeps from empty; the
	// stroke-dashoffset (with pathLength 100) maps 1:1 to the percent value.
	const ringTrack = $derived(arcPath(startAngle, endAngle));
	const ringOffset = $derived(100 - clamped);

	const notches = $derived.by(() => {
		const notchAngle = (totalAngle * (1 - spacing / 100)) / totalNotches;
		const gapAngle = (totalAngle * (spacing / 100)) / Math.max(1, totalNotches - 1);
		const half = (notchAngle * 0.8 * Math.PI) / 180 / 2;
		const items: { d: string; active: boolean; index: number }[] = [];
		for (let i = 0; i < totalNotches; i++) {
			const angle = startAngle + i * (notchAngle + gapAngle) + notchAngle / 2;
			items.push({
				index: i,
				active: i < activeCount,
				d: notchPath(buildQuad(angle, half), corner),
			});
		}
		return items;
	});

	// =========================
	// FUNCTIONS
	// =========================
	function buildQuad(
		angleDeg: number,
		half: number,
	): [number, number, number, number, number, number, number, number] {
		const rad = (angleDeg * Math.PI) / 180;
		if (uniformWidth) {
			// WHY: constant perpendicular half-width gives rectangular notches; the
			// chord at the mid radius keeps them visually consistent with tapered ones.
			const w = midR * Math.sin(half);
			const ux = Math.cos(rad);
			const uy = Math.sin(rad);
			const px = -uy;
			const py = ux;
			const ox = CX + ux * OUTER_R;
			const oy = CY + uy * OUTER_R;
			const ix = CX + ux * innerR;
			const iy = CY + uy * innerR;
			return [
				ox + px * w,
				oy + py * w,
				ox - px * w,
				oy - py * w,
				ix - px * w,
				iy - py * w,
				ix + px * w,
				iy + py * w,
			];
		}
		return [
			CX + Math.cos(rad - half) * OUTER_R,
			CY + Math.sin(rad - half) * OUTER_R,
			CX + Math.cos(rad + half) * OUTER_R,
			CY + Math.sin(rad + half) * OUTER_R,
			CX + Math.cos(rad + half) * innerR,
			CY + Math.sin(rad + half) * innerR,
			CX + Math.cos(rad - half) * innerR,
			CY + Math.sin(rad - half) * innerR,
		];
	}

	function arcPath(startDeg: number, endDeg: number): string {
		const a0 = (startDeg * Math.PI) / 180;
		const a1 = (endDeg * Math.PI) / 180;
		const sx = CX + Math.cos(a0) * midR;
		const sy = CY + Math.sin(a0) * midR;
		const ex = CX + Math.cos(a1) * midR;
		const ey = CY + Math.sin(a1) * midR;
		const large = endDeg - startDeg > 180 ? 1 : 0;
		return `M ${sx} ${sy} A ${midR} ${midR} 0 ${large} 1 ${ex} ${ey}`;
	}

	// WHY: rounded corners (lerp toward each vertex, then a quadratic through it)
	// read as soft pills, matching the bklit gauge look.
	function notchPath([x1, y1, x2, y2, x3, y3, x4, y4]: number[], cornerR: number): string {
		if (cornerR <= 0) {
			return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
		}
		const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
		const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);
		const d12 = dist(x1, y1, x2, y2);
		const d23 = dist(x2, y2, x3, y3);
		const d34 = dist(x3, y3, x4, y4);
		const d41 = dist(x4, y4, x1, y1);
		const r1 = Math.min(cornerR / d12, 0.49);
		const r2 = Math.min(cornerR / d23, 0.49);
		const r3 = Math.min(cornerR / d34, 0.49);
		const r4 = Math.min(cornerR / d41, 0.49);
		const p = (ax: number, ay: number, bx: number, by: number, t: number) =>
			`${lerp(ax, bx, t)} ${lerp(ay, by, t)}`;
		return (
			`M ${p(x1, y1, x4, y4, r4)} Q ${x1} ${y1} ${p(x1, y1, x2, y2, r1)} ` +
			`L ${p(x2, y2, x1, y1, r1)} Q ${x2} ${y2} ${p(x2, y2, x3, y3, r2)} ` +
			`L ${p(x3, y3, x2, y2, r2)} Q ${x3} ${y3} ${p(x3, y3, x4, y4, r3)} ` +
			`L ${p(x4, y4, x3, y3, r3)} Q ${x4} ${y4} ${p(x4, y4, x1, y1, r4)} Z`
		);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class={cn("hr-gauge", className)}
	style:width={size ? `${size}px` : "100%"}
	style:min-width="{minWidth}px"
	role="img"
	aria-label={ariaLabel
		? `${ariaLabel}: ${Math.round(clamped)}%`
		: `Gauge at ${Math.round(clamped)}%`}
>
	<svg viewBox="0 0 100 100" aria-hidden="true">
		{#if effGradient}
			<defs>
				<linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="92" y2="0">
					<stop offset="0%" stop-color={gradStops[0]} />
					<stop offset="100%" stop-color={gradStops[1]} />
				</linearGradient>
			</defs>
		{/if}
		{#if variant === "ring"}
			<path
				class="ring-track"
				d={ringTrack}
				stroke={trackFill}
				stroke-opacity={inactiveFillOpacity}
				style:stroke-width="{band}px"
			/>
			<path
				class="ring-fill"
				d={ringTrack}
				pathLength="100"
				stroke={activePaint}
				style:stroke-width="{band}px"
				style:stroke-dashoffset={ringOffset}
			/>
		{:else}
			{#each notches as notch (notch.index)}
				<path class="track" d={notch.d} fill={trackFill} fill-opacity={inactiveFillOpacity} />
			{/each}
			{#each notches as notch (notch.index)}
				{#if notch.active}
					<path
						class="fill"
						d={notch.d}
						fill={activePaint}
						fill-opacity={activeFillOpacity}
						style:animation-delay="{100 + notch.index * 18}ms"
					/>
				{/if}
			{/each}
		{/if}
	</svg>

	{#if showValue}
		<div class="center">
			<span class="value">
				<AnimatedValue value={center} {formatOptions} {locale} {prefix} {suffix} />
			</span>
			{#if effLabel}
				<span class="label">{effLabel}</span>
			{/if}
		</div>
	{/if}
</div>
