/** Usage snippets for the Effects and Charts pages, by slug. */
export const visuals: Record<string, string> = {
  marquee: `
<Marquee repeat={4} pauseOnHover>
  {#each items as item (item)}
    <span>{item}</span>
  {/each}
</Marquee>
<Marquee overflowOnly class="max-w-56 whitespace-nowrap">{title}</Marquee>`,

  "text-effect": `
<TextEffect text="Ship the thing." per="char" preset="blur-slide" as="h3" onMount />`,

  "animated-beam": `
<div bind:this={container} class="relative">
  <div bind:this={from}>A</div>
  <div bind:this={to}>B</div>
  {#if container && from && to}
    <AnimatedBeam containerRef={container} fromRef={from} toRef={to} />
  {/if}
</div>`,

  "in-view": `
<InView preset="slide" amount={0.4}>
  {#snippet children()}
    <span>Block 1</span>
  {/snippet}
</InView>
<p use:onInView={{ amount: 0.6, onEnter: () => (seen = true) }}>Keep scrolling.</p>`,

  "animated-group": `
<AnimatedGroup preset="blur-slide" stagger={70} onMount>
  {#each rows as row (row)}
    <span>{row}</span>
  {/each}
</AnimatedGroup>`,

  "image-comparison": `
<ImageComparison
  class="aspect-video"
  bind:position
  before={{ src: "/before.png", alt: "The page before the redesign" }}
  after={{ src: "/after.png", alt: "The page after the redesign" }}
/>`,

  magnetic: `
<button use:magnetic={{ intensity: 0.5, range: 130 }}>Book a call</button>`,

  "area-chart": `
<AreaChart
  data={[{ month: "Jan", revenue: 3200, cost: 1800 }]}
  xKey="month"
  series={[
    { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
    { key: "cost", label: "Cost", color: "var(--chart-3)" },
  ]}
  height={260}
/>`,

  "line-chart": `
<LineChart
  data={[{ day: "Mon", visits: 1240, signups: 120 }]}
  xKey="day"
  series={[
    { key: "visits", label: "Visits", color: "var(--chart-1)" },
    { key: "signups", label: "Signups", color: "var(--chart-2)" },
  ]}
  height={260}
/>`,

  "bar-chart": `
<BarChart
  data={[{ plan: "Pro", users: 1480 }]}
  xKey="plan"
  yKey="users"
  yLabel="Users"
  height={260}
/>`,

  "time-series-chart": `
<TimeSeriesChart
  data={[{ date: "2026-07-01", value: 1200, value2: 900 }]}
  label="This period"
  label2="Previous"
  height={280}
/>`,

  "donut-chart": `
<DonutChart
  data={[{ source: "Direct", visits: 4200, color: "var(--chart-1)" }]}
  valueKey="visits"
  labelKey="source"
  colorKey="color"
  centerLabel="Visits"
/>
<Legend items={[{ label: "Direct", value: 4200, color: "var(--chart-1)" }]} showValue />`,

  "ring-chart": `
<RingChart
  data={[{ label: "Move", value: 520, maxValue: 600, color: "var(--chart-4)" }]}
  size={240}
  defaultLabel="Today"
/>`,

  "gauge-chart": `
<div class="size-44">
  <GaugeChart value={72} label="Health" />
</div>`,

  "number-chart": `
<NumberChart
  label="MRR"
  value={18400}
  delta={8.2}
  direction="up-good"
  formatOptions={{ style: "currency", currency: "USD" }}
/>`,

  sparkline: `
<Sparkline data={[{ i: 0, v: 3 }, { i: 1, v: 4.2 }]} xKey="i" yKey="v" showLast />`,

  "stat-card": `
<StatCard
  label="Revenue"
  value={48200}
  delta={12.4}
  caption="vs last month"
  variant="area"
  data={[{ m: "Jan", v: 3200 }]}
  xKey="m"
  yKey="v"
/>`,
};
