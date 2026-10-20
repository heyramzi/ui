# @heyramzi/charts

Svelte 5 charts on [LayerChart](https://layerchart.com): area, line, bar, donut, ring, gauge, sparkline, time series and stat cards. One set of tokens, a crosshair tooltip, a screen reader data table on the bar chart, and an entrance sweep that respects `prefers-reduced-motion`.

They started inside `@heyramzi/ui` and moved out so a dashboard doesn't have to install the rest of the kit. Live demos: [ui.heyramzi.com/charts](https://ui.heyramzi.com/charts).

## Install

```
pnpm add @heyramzi/charts
```

`svelte` (5.57 or newer) is a peer. LayerChart, d3-scale and d3-shape come with the package.

## Setup

The charts read the shadcn token set (`--foreground`, `--border`, `--popover`, `--chart-1` to `--chart-5`) and a few motion tokens. The quickest way to get all of them is the token sheet from `@heyramzi/ui`:

```css
@import "tailwindcss";
@import "@heyramzi/ui/tokens.css";
@import "@heyramzi/ui/animations";

@source "../node_modules/@heyramzi/charts";
```

The `@source` line matters: the chart markup carries Tailwind classes, and Tailwind only scans your own app unless you point it at the package. If you define the tokens yourself, you don't need `@heyramzi/ui` at all. Dark mode keys off a `.dark` class on `html`.

## Usage

```svelte
<script lang="ts">
  import { AreaChart } from "@heyramzi/charts";

  const data = [
    { month: "Jan", revenue: 3200, cost: 1800 },
    { month: "Feb", revenue: 4100, cost: 2100 },
    { month: "Mar", revenue: 3800, cost: 2400 },
  ];
</script>

<AreaChart
  {data}
  xKey="month"
  series={[
    { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
    { key: "cost", label: "Cost", color: "var(--chart-3)" },
  ]}
  formatValue={(v) => `$${v.toLocaleString()}`}
  height={260}
/>
```

## What is inside

| Export | What it is |
| --- | --- |
| `AreaChart`, `LineChart`, `BarChart` | Cartesian charts with a crosshair, soft edges and an entrance sweep |
| `TimeSeriesChart` | Dates on the x axis, a comparison line and a tooltip |
| `DonutChart`, `RingChart`, `GaugeChart` | Round charts, with a hover readout in the middle |
| `Sparkline` | A tiny trend line for tables and cards |
| `StatCard`, `NumberChart`, `TrendPill`, `AnimatedValue` | A headline number that counts up, with a delta that knows whether up is good news |
| `Legend`, `Figure`, `EdgeFade` | Legend rows, a captioned figure frame and an edge mask |
| `ChartContainer`, `ChartTooltip`, `ChartStyle`, `useChart` | The shadcn-style wrapper, for a chart you build yourself on LayerChart |

## Dashboard

`@heyramzi/charts/dashboard` is the page kit around the charts: the parts a reporting page repeats. It sits on `@heyramzi/ui` (the segmented control, the data table pager, the panel label), so it needs that peer at 8 or newer. The charts above don't.

| Export | What it is |
| --- | --- |
| `DashboardSection`, `PanelGrid`, `StatBand` | A named area, a row of panels side by side, a row of number cards |
| `StatTile` | A number card on `NumberChart`: a delta, a share track, a trend shape behind the figure, an optional link |
| `DataPanel`, `DashboardEmpty` | A titled panel for a table or chart, and the dashed empty state |
| `DataTable`, `DataSortHead`, `RatingChip` | The one data table: sortable heads, a row that opens, columns that hide on a phone, share bars, loading and empty states. An A to E grade chip |
| `PeriodFilter`, `DAY_WINDOWS` | The 7, 30 and 90 day window, as a filter or as links |
| `CHART_HEIGHT`, `dataTableClass` and friends | The one chart height and the table skin |

```svelte
<script lang="ts">
  import { DashboardSection, StatBand, StatTile } from "@heyramzi/charts/dashboard";
</script>

<DashboardSection title="Revenue" note="Last 30 days">
  <StatBand>
    <StatTile label="Sales" value="$12,480" deltaPct={8.2} direction="up-good" lead />
  </StatBand>
</DashboardSection>
```

## Moving from `@heyramzi/ui/charts`

The charts left `@heyramzi/ui` in its next major. Swap the import and install the new package:

```diff
-import { AreaChart } from "@heyramzi/ui/charts";
+import { AreaChart } from "@heyramzi/charts";
```

Nothing else changed: the same exports, the same props, the same CSS.

## License

MIT
