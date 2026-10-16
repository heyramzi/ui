<script lang="ts">
  import { StatCard } from "@heyramzi/charts";

  const data = [
    { m: "Jan", v: 3200 },
    { m: "Feb", v: 4100 },
    { m: "Mar", v: 3800 },
    { m: "Apr", v: 5300 },
    { m: "May", v: 6100 },
    { m: "Jun", v: 7200 },
  ];
</script>

<div class="@container w-full max-w-[44rem]">
  <div class="grid gap-4 @xl:grid-cols-3">
    <StatCard label="Revenue" value={48200} delta={12.4} caption="vs last month" variant="area" {data} xKey="m" yKey="v" />
    <StatCard label="Orders" value={1284} delta={-3.1} caption="vs last month" variant="bar" {data} xKey="m" yKey="v" color="var(--chart-3)" />
    <StatCard label="Uptime" value={99} delta={0.2} caption="30 days" variant="gauge" gaugeValue={99} gaugeLabel="Uptime" />
  </div>
</div>
