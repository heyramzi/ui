<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "./figure.css";
	import { cn } from "@heyramzi/utils";
	import type { Snippet } from "svelte";
	import AnimatedValue from "./animated-value.svelte";
	import TrendPill from "./trend-pill.svelte";

	// =========================
	// TYPES
	// =========================
	type Trend = "up" | "down" | "neutral";
	type SeriesValue = { value: number; label?: string; color?: string };

	interface Props {
		/** Single metric value. Numbers count up via AnimatedValue. Ignored when `series` is set. */
		value?: number | string;
		/** Multiple value rows (chart headers with more than one series). */
		series?: SeriesValue[];
		/** Single-value color. */
		color?: string;
		/** Title above the value (KPI card). Pairs with `delta` for a trend pill. */
		title?: string;
		/** Percentage change; renders a TrendPill beside the title. */
		delta?: number;
		trend?: Trend;
		/** Sub-caption under the value. */
		caption?: string;
		/** Uppercase context label under the value (chart headers, e.g. "JUN"). */
		eyebrow?: string;
		/** Left header (md, monospace) vs centered overlay reuse later. */
		align?: "start" | "center";
		/** Value scale: md = chart header, lg = KPI card. */
		size?: "md" | "lg";
		format?: (v: number) => string;
		formatOptions?: Intl.NumberFormatOptions;
		locale?: string;
		animate?: boolean;
		/** Leading icon before the title. */
		icon?: Snippet;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		value,
		series,
		color,
		title,
		delta,
		trend,
		caption,
		eyebrow,
		align = "start",
		size = "md",
		format,
		formatOptions,
		locale,
		animate = true,
		icon,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	const rows = $derived(series && series.length > 0 ? series : null);
</script>

<!-- =========================== -->
<!-- FIGURE -->
<!-- =========================== -->
<div class={cn("hr-figure", className)} data-align={align} data-size={size}>
	{#if title}
		<div class="hr-figure-head">
			<span class="hr-figure-title">
				{#if icon}<span class="hr-figure-icon" style:color>{@render icon()}</span>{/if}
				<span class="hr-figure-title-text">{title}</span>
			</span>
			{#if delta != null}
				<TrendPill {delta} {trend} />
			{/if}
		</div>
	{/if}

	{#if rows}
		<div class="hr-figure-values">
			{#each rows as row, i (i)}
				<!-- WHY the series colour goes in as a custom property rather than as `color`: a palette entry is picked to read as a line on a chart, which -->
				<!-- is a 3:1 job, and the same value as 11px text measured 2.7:1. The stylesheet mixes it toward the page foreground, so the number still -->
				<!-- names its series and the text still clears AA in either theme. -->
				<span class="hr-figure-value-row" style:--hr-series={row.color}>
					<span class="hr-figure-value is-series">
						<AnimatedValue value={row.value} {format} {formatOptions} {locale} duration={450} />
					</span>
					{#if rows.length > 1 && row.label}
						<span class="hr-figure-series-label is-series">{row.label}</span>
					{/if}
				</span>
			{/each}
		</div>
	{:else if value != null}
		<span class="hr-figure-value" style:color>
			{#if typeof value === "number" && animate}
				<AnimatedValue {value} {format} {formatOptions} {locale} duration={600} />
			{:else}
				{value}
			{/if}
		</span>
	{/if}

	{#if caption}
		<span class="hr-figure-caption">{caption}</span>
	{/if}
	{#if eyebrow}
		<span class="hr-figure-eyebrow">{eyebrow}</span>
	{/if}
</div>
