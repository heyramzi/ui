<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "./legend.css";
	import { cn } from "@heyramzi/utils";

	// =========================
	// TYPES
	// =========================
	type LegendItem = {
		label: string;
		value: number;
		/** Required when `showProgress` or `showPercentage` is set. */
		maxValue?: number;
		color: string;
	};

	type Props = {
		items: LegendItem[];
		title?: string;
		/** Stacked rows vs inline wrap. */
		layout?: "vertical" | "horizontal";
		/** Render a progress bar under each row (needs maxValue). */
		showProgress?: boolean;
		/** Show the value beside each label. */
		showValue?: boolean;
		/** Append a percentage (needs maxValue). */
		showPercentage?: boolean;
		formatValue?: (v: number) => string;
		formatPercentage?: (p: number) => string;
		/** Hovered index, bindable for chart hover-sync. */
		hoveredIndex?: number | null;
		onHoverChange?: (index: number | null) => void;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		items,
		title,
		layout = "vertical",
		showProgress = false,
		showValue = true,
		showPercentage = false,
		formatValue = (v) => v.toLocaleString(),
		formatPercentage = (p) => `${p.toFixed(0)}%`,
		hoveredIndex = $bindable(null),
		onHoverChange,
		class: className,
	}: Props = $props();

	// =========================
	// FUNCTIONS
	// =========================
	function pct(item: LegendItem): number {
		if (!item.maxValue || item.maxValue <= 0) return 0;
		return Math.max(0, Math.min(100, (item.value / item.maxValue) * 100));
	}

	function setHover(index: number | null) {
		hoveredIndex = index;
		onHoverChange?.(index);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("hr-legend", className)} class:horizontal={layout === "horizontal"}>
	{#if title}
		<p class="hr-legend-title">{title}</p>
	{/if}
	<ul class="hr-legend-items">
		{#each items as item, i (item.label + i)}
			{@const dimmed = hoveredIndex !== null && hoveredIndex !== i}
			<li>
				<button
					type="button"
					class="hr-legend-item"
					class:dimmed
					onmouseenter={() => setHover(i)}
					onmouseleave={() => setHover(null)}
					onfocus={() => setHover(i)}
					onblur={() => setHover(null)}
				>
					<span class="hr-legend-marker" style:background={item.color}></span>
					<span class="hr-legend-label">{item.label}</span>
					{#if showValue}
						<span class="hr-legend-value">
							{formatValue(item.value)}{#if showPercentage && item.maxValue}<span
									class="hr-legend-pct">{formatPercentage(pct(item))}</span
								>{/if}
						</span>
					{/if}
					{#if showProgress && item.maxValue}
						<span class="hr-legend-track">
							<span
								class="hr-legend-bar"
								style:--hr-bar-scale={pct(item) / 100}
								style:background={item.color}
								style:animation-delay="{160 + i * 120}ms"
							></span>
						</span>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
</div>
