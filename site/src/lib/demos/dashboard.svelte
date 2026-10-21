<script lang="ts">
  import { AreaChart } from "@heyramzi/ui/charts";
  import {
    DataPanel,
    DashboardSection,
    PanelGrid,
    PeriodFilter,
    StatBand,
    StatTile,
    DAY_WINDOWS,
  } from "@heyramzi/ui/charts/dashboard";

  const windows = DAY_WINDOWS.map((days) => ({ value: String(days), label: `${days}d` }));
  let period = $state("30");

  const series = [12, 14, 13, 18, 17, 22, 21, 26, 25, 31];
  const data = series.map((value, index) => ({ day: index + 1, value }));
</script>

<div class="flex w-full max-w-3xl flex-col gap-4">
  <div class="flex justify-end">
    <PeriodFilter options={windows} value={period} onValueChange={(next) => (period = next)} ariaLabel="Window" />
  </div>
  <DashboardSection title="Revenue" note="Last {period} days">
    <StatBand columns={3}>
      <StatTile label="Sales" value="$12,480" deltaPct={8.2} direction="up-good" lead {series} />
      <StatTile label="Refunds" value="$320" deltaPct={-12} direction="down-good" />
      <StatTile label="Orders" value="214" deltaPct={3.1} direction="up-good" />
    </StatBand>
    <PanelGrid columns={2}>
      <DataPanel label="Sales per day" hint="{period} days">
        <AreaChart {data} xKey="day" series={[{ key: "value", label: "Sales" }]} height={200} />
      </DataPanel>
    </PanelGrid>
  </DashboardSection>
</div>
