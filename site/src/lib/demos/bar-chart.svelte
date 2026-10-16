<script lang="ts">
  import { BarChart } from "@heyramzi/charts";

  const data = [
    { plan: "Free", users: 4200 },
    { plan: "Starter", users: 2650 },
    { plan: "Pro", users: 1480 },
    { plan: "Team", users: 720 },
    { plan: "Scale", users: 310 },
  ];
</script>

<BarChart {data} xKey="plan" yKey="users" yLabel="Users" height={260} />
