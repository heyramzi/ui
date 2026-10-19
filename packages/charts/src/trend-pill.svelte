<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/trend-pill.css";
	import { cn } from "@heyramzi/utils";

	// =========================
	// TYPES
	// =========================
	type Trend = "up" | "down" | "neutral";

	interface Props {
		/** Percentage change. Its sign drives the color/arrow unless `trend` is set. */
		delta: number;
		/** Force the direction independent of `delta`'s sign. */
		trend?: Trend;
		/** Format the delta text. */
		format?: (v: number) => string;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		delta,
		trend,
		format = (v) =>
			`${v > 0 ? "+" : ""}${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	const resolved = $derived<Trend>(trend ?? (delta === 0 ? "neutral" : delta > 0 ? "up" : "down"));
</script>

<!-- =========================== -->
<!-- TREND PILL -->
<!-- =========================== -->
<span class={cn("hr-trend", className)} data-trend={resolved}>
	{#if resolved !== "neutral"}
		<span class="hr-trend-arrow" aria-hidden="true">{resolved === "up" ? "↑" : "↓"}</span>
	{/if}
	{format(delta)}
</span>
