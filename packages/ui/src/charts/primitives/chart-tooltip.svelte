<script lang="ts">
	import { getChartContext, Tooltip as TooltipPrimitive } from "layerchart";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef, type WithoutChildren } from "@heyramzi/utils";
	import {
		getPayloadConfigFromPayload,
		type TooltipSeriesItem,
		useChart,
	} from "#src/charts/primitives/chart-utils.js";

	function defaultFormatter(value: unknown, _series: TooltipSeriesItem[]) {
		return `${value}`;
	}

	let {
		ref = $bindable(null),
		class: className,
		hideLabel = false,
		indicator = "dot",
		hideIndicator = false,
		labelKey,
		label,
		labelFormatter = defaultFormatter,
		labelClassName,
		formatter,
		nameKey,
		color,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
		hideLabel?: boolean;
		label?: string;
		indicator?: "line" | "dot" | "dashed";
		nameKey?: string;
		labelKey?: string;
		hideIndicator?: boolean;
		labelClassName?: string;
		labelFormatter?:
			| ((value: unknown, series: TooltipSeriesItem[]) => string | number | Snippet)
			| null;
		formatter?: Snippet<
			[
				{
					value: unknown;
					name: string;
					item: TooltipSeriesItem;
					index: number;
					series: TooltipSeriesItem[];
				},
			]
		>;
	} = $props();

	const chart = useChart();
	const ctx = getChartContext();

	const tooltipSeries = $derived(ctx.tooltip.series as TooltipSeriesItem[]);

	const formattedLabel = $derived.by(() => {
		if (hideLabel || !tooltipSeries?.length) return null;

		const [item] = tooltipSeries;
		const key = labelKey ?? item?.label ?? item?.key ?? "value";

		const itemConfig = getPayloadConfigFromPayload(chart.config, item, key);

		const value =
			!labelKey && typeof label === "string"
				? (chart.config[label as keyof typeof chart.config]?.label ?? label)
				: (itemConfig?.label ?? item.label);

		if (value === undefined) return null;
		if (!labelFormatter) return value;
		return labelFormatter(value, tooltipSeries);
	});

	const nestLabel = $derived(tooltipSeries.length === 1 && indicator !== "dot");
</script>

{#snippet TooltipLabel()}
	{#if formattedLabel}
		<div class={cn("font-medium", labelClassName)}>
			{#if typeof formattedLabel === "function"}
				{@render formattedLabel()}
			{:else}
				{formattedLabel}
			{/if}
		</div>
	{/if}
{/snippet}

<TooltipPrimitive.Root variant="none">
	<div
		class={cn(
			"border-border/50 bg-background grid min-w-[9rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
			className,
		)}
		{...restProps}
	>
		{#if !nestLabel}
			{@render TooltipLabel()}
		{/if}
		<div class="grid gap-1.5">
			{#each tooltipSeries as item, i (item.key + i)}
				{@const key = `${nameKey || item.key || "value"}`}
				{@const itemConfig = getPayloadConfigFromPayload(chart.config, item, key)}
				{@const indicatorColor = color || item.color}
				<div
					class={cn(
						"[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5",
						indicator === "dot" && "items-center",
					)}
				>
					{#if formatter && item.value !== undefined && item.key}
						{@render formatter({
							value: item.value,
							name: item.label || item.key,
							item,
							index: i,
							series: tooltipSeries,
						})}
					{:else}
						{#if itemConfig?.icon}
							<itemConfig.icon />
						{:else if !hideIndicator}
							<div
								style="--color-bg: {indicatorColor}; --color-border: {indicatorColor};"
								class={cn("border-(--color-border) bg-(--color-bg) shrink-0 rounded-[2px]", {
									"size-2.5": indicator === "dot",
									"h-full w-1": indicator === "line",
									"w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
									"my-0.5": nestLabel && indicator === "dashed",
								})}
							></div>
						{/if}
						<div
							class={cn(
								"flex flex-1 shrink-0 justify-between leading-none",
								nestLabel ? "items-end" : "items-center",
							)}
						>
							<div class="grid gap-1.5">
								{#if nestLabel}
									{@render TooltipLabel()}
								{/if}
								<span class="text-muted-foreground">
									{itemConfig?.label || item.label || item.key}
								</span>
							</div>
							{#if item.value !== undefined}
								<span class="text-foreground font-mono font-medium tabular-nums">
									{typeof item.value === "number" ? item.value.toLocaleString() : item.value}
								</span>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</TooltipPrimitive.Root>
