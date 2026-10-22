<script lang="ts">
  import { applyBrand, defineBrand } from "@heyramzi/ui/brand";
  import { Button } from "@heyramzi/ui/shadcn/button";
  import { Switch } from "@heyramzi/ui/shadcn/switch";
  import { Badge } from "@heyramzi/ui/shadcn/badge";

  const brands = [
    { name: "Neutral", brand: null },
    { name: "Indigo", brand: defineBrand({ colors: { brand: "oklch(0.51 0.23 277)", brandOnDark: "oklch(0.72 0.16 277)" } }) },
    { name: "Emerald", brand: defineBrand({ colors: { brand: "oklch(0.55 0.15 163)", brandOnDark: "oklch(0.76 0.15 163)" } }) },
    { name: "Coral", brand: defineBrand({ colors: { brand: "oklch(0.64 0.19 30)", brandOnDark: "oklch(0.74 0.15 30)" } }) },
  ];

  let picked = $state("Neutral");
  let on = $state(true);

  // The brand goes on <html>, the way an app sets it, and comes off when the demo leaves.
  $effect(() => {
    const brand = brands.find((b) => b.name === picked)?.brand;
    if (!brand) return;
    return applyBrand(brand);
  });
</script>

<div class="flex w-full max-w-md flex-col gap-6">
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Brand">
    {#each brands as b (b.name)}
      <button
        role="radio"
        aria-checked={picked === b.name}
        onclick={() => (picked = b.name)}
        class="rounded-full border px-3 py-1 text-[13px] transition-colors {picked === b.name ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
      >{b.name}</button>
    {/each}
  </div>
  <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
    <Button>Save changes</Button>
    <Button variant="outline">Cancel</Button>
    <Switch bind:checked={on} aria-label="Notifications" />
    <Badge>Live</Badge>
    <a href="#top" class="text-sm text-brand underline underline-offset-4">View invoice</a>
  </div>
</div>
