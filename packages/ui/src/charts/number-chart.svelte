<script lang="ts" module>
	/**
	 * Which way a metric has to move to be good news.
	 */

	/*
	 * `neutral` is the honest answer for a figure that is neither on its own: spend is not a win or a loss until the return is beside it.
	 */
	export type NumberDirection = "up-good" | "down-good" | "neutral";
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/number-chart.css";
	import { Minus, TrendDown, TrendUp } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import type { Snippet } from "svelte";
	import AnimatedValue from "#src/charts/animated-value.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Metric name, above the figure. */
		label: string;
		/**
		 * The figure.
		 */

		/*
		 * A number counts up and is formatted here; a string is taken as already formatted and is printed as it stands, which is the only way to draw a total
		 */

		/*
		 * that mixes two currencies.
		 */
		value: number | string;
		/** Formatter for a numeric `value`. Wins over `formatOptions`. */
		format?: (v: number) => string;
		/** Intl options for a numeric `value` (currency, compact, percent). */
		formatOptions?: Intl.NumberFormatOptions;
		/** BCP-47 locale for `formatOptions`. */
		locale?: string;
		/**
		 * Change against the period before this one, as a percentage. `null` is
		 * "nothing to compare against", which is not zero and is drawn as a dash.
		 */
		delta?: number | null;
		/** Which way `delta` has to point to be good news. */
		direction?: NumberDirection;
		/** Movement below this many points is noise and draws as a dash. */
		deltaThreshold?: number;
		/**
		 * The chart. A fraction from 0 to 1 that gives the figure its scale: a share of a total, a run against a target, a rate against its ceiling.
		 */

		/*
		 * Omitted, the number stands on its own and no track is drawn.
		 */
		share?: number;
		/** What the track measures, e.g. "of revenue". Only with `share`. */
		shareLabel?: string;
		/** Track colour. Defaults to the first series token. */
		color?: string;
		/** md is a figure in a row; lg is the one figure the screen exists to answer. */
		size?: "md" | "lg";
		/** A quiet line under the figure: the window it covers, or why it is a dash. */
		caption?: string;
		/** A loss or an overrun: the figure turns the destructive colour. */
		negative?: boolean;
		/**
		 * Drop the card chrome. For a figure that sits in a band or a panel of its
		 * own, where a second border would draw a box inside a box.
		 */
		bare?: boolean;
		/** Leading icon before the label. */
		icon?: Snippet;
		/** Rendered at the right of the label row. */
		trailing?: Snippet;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		label,
		value,
		format,
		formatOptions,
		locale,
		delta = null,
		direction = "neutral",
		deltaThreshold = 0.5,
		share,
		shareLabel,
		color = "var(--chart-1)",
		size = "md",
		caption,
		negative = false,
		bare = false,
		icon,
		trailing,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	// Under half a point either way is noise, not a movement, and eight figures
	// each reporting a 0% move is eight pieces of chrome saying nothing.
	const move = $derived(delta != null && Math.abs(delta) >= deltaThreshold ? delta : null);
	// The arrow follows the sign and the colour follows the news, because a cost
	// that fell is a green figure with a down arrow. One glyph cannot say both.
	const tone = $derived.by(() => {
		if (move == null || direction === "neutral") return "flat";
		const good = direction === "up-good" ? move > 0 : move < 0;
		return good ? "up" : "down";
	});
	// The track stops at full; the label says the real figure, so a 111% overrun never reads 100%.
	const pct = $derived(share == null ? null : Math.max(0, Math.min(1, share)));
	const sharePct = $derived(share == null ? null : Math.round(Math.max(0, share) * 100));
</script>

<!-- =========================== -->
<!-- NUMBER CHART -->
<!-- =========================== -->
<div
	class={cn("hr-number-chart", className)}
	data-size={size}
	data-bare={bare ? "" : undefined}
	data-negative={negative ? "" : undefined}
>
	<p class="hr-number-label">
		{#if icon}<span class="hr-number-icon" style:color>{@render icon()}</span>{/if}
		<span class="hr-number-label-text">{label}</span>
		{#if trailing}<span class="hr-number-trailing">{@render trailing()}</span>{/if}
	</p>

	<div class="hr-number-row">
		<span class="hr-number-value">
			{#if typeof value === "number"}
				<AnimatedValue {value} {format} {formatOptions} {locale} duration={600} />
			{:else}
				{value}
			{/if}
		</span>
		{#if move != null}
			<span class="hr-number-delta" data-tone={tone}>
				{#if move > 0}
					<TrendUp class="hr-number-arrow" weight="bold" />
				{:else}
					<TrendDown class="hr-number-arrow" weight="bold" />
				{/if}
				<span class="hr-number-delta-text">{Math.abs(move).toFixed(0)}%</span>
			</span>
		{:else}
			<span class="hr-number-delta" data-tone="none" aria-hidden="true">
				<Minus class="hr-number-arrow" />
			</span>
		{/if}
	</div>

	{#if pct != null}
		<!-- WHY the number gets a rail and not a sparkline: one figure has no series to plot, and the question a lone number cannot answer is "out of -->
		<!-- what". The rail answers exactly that and nothing else. -->
		<div
			class="hr-number-track"
			role="img"
			aria-label="{label}: {sharePct}% {shareLabel ?? 'of the total'}"
		>
			<span class="hr-number-fill" style:--hr-number-share={pct} style:background={color}></span>
		</div>
	{/if}

	{#if shareLabel && pct != null}
		<p class="hr-number-caption">
			<span class="hr-number-share">{sharePct}%</span>
			{shareLabel}
		</p>
	{/if}
	{#if caption}
		<p class="hr-number-caption">{caption}</p>
	{/if}
</div>
