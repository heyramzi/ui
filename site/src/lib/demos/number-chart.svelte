<script lang="ts">
  import { NumberChart } from "@heyramzi/ui/charts";

  const usd = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;
</script>

<div class="@container w-full max-w-2xl">
  <div class="grid gap-6 @lg:grid-cols-3">
    <NumberChart label="MRR" value={18400} delta={8.2} direction="up-good" formatOptions={usd} />
    <NumberChart label="Churn" value={0.024} delta={-0.6} direction="down-good" formatOptions={{ style: "percent", minimumFractionDigits: 1 }} />
    <NumberChart label="Ad spend" value={4200} delta={14} direction="neutral" formatOptions={usd} />
  </div>
</div>
