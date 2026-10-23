<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import type { GanttDay, Layout } from "#src/work/gantt/logic.js";

	interface Props {
		layout: Layout;
		days: GanttDay[];
		months: { key: string; label: string; i: number; length: number }[];
		labelHeading: string;
		locale: string;
		corner?: HTMLDivElement;
	}

	let { layout, days, months, labelHeading, locale, corner = $bindable() }: Props = $props();

	let weekdayFormat = $derived(
		new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }),
	);
</script>

<!-- Months over days, pinned to the top. -->
<div class="sticky top-0 z-30 flex border-b border-border bg-card/90 backdrop-blur-sm">
	<div
		bind:this={corner}
		class="sticky left-0 z-10 flex w-(--g-label) shrink-0 items-end border-r border-border bg-card px-3 pb-2 text-xs font-medium text-muted-foreground"
	>
		{labelHeading}
	</div>
	<div class="relative shrink-0" style:width="{layout.timelineWidth}px">
		<div class="relative h-7 border-b border-border/60">
			{#each months as month (month.key)}
				<div
					class="absolute inset-y-0 border-l border-border/60 first:border-l-0"
					style:left="{month.i * layout.dayWidth}px"
					style:width="{month.length * layout.dayWidth}px"
				>
					<span
						class="sticky left-(--g-label) inline-block px-2 pt-1.5 text-xs font-medium whitespace-nowrap text-foreground"
					>
						{month.label}
					</span>
				</div>
			{/each}
		</div>
		<div class="flex h-8">
			{#each days as d (d.day)}
				{@const isToday = d.day === layout.todayDay}
				{@const showNumber = layout.dayWidth >= 18 || d.wd === 1}
				<div
					class={cn(
						"relative flex shrink-0 flex-col items-center justify-center text-[10px] leading-none tabular-nums",
						d.weekend ? "text-muted-foreground/50" : "text-muted-foreground",
						layout.dayWidth < 18 && d.wd === 1 && "border-l border-border/60",
					)}
					style:width="{layout.dayWidth}px"
				>
					{#if layout.dayWidth >= 26}
						<span class="mb-0.5 opacity-70"
							>{weekdayFormat.format(new Date(d.day * 86_400_000))}</span
						>
					{/if}
					{#if showNumber}
						<span
							class={cn(
								"grid h-4 min-w-4 place-items-center rounded-full px-1 font-medium",
								layout.dayWidth < 18 && "absolute left-1 whitespace-nowrap",
								isToday && "bg-primary text-primary-foreground",
							)}
						>
							{d.date}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
