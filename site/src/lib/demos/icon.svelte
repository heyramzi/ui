<script lang="ts">
  import { Icon } from "@heyramzi/ui/components/icon";
  import { Svg } from "@heyramzi/ui/components/svg";
  import { Bell, Calendar, ChatCircle, Gear } from "phosphor-svelte";

  const weights = ["thin", "light", "regular", "bold", "fill", "duotone"] as const;
  const mark = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>`;
</script>

<div class="flex flex-col items-center gap-6">
  <div class="flex items-end gap-4 text-foreground">
    {#each [16, 20, 24, 32] as size (size)}<Icon icon={Calendar} {size} />{/each}
  </div>
  <div class="flex gap-4 text-muted-foreground">
    {#each weights as weight (weight)}<Icon icon={Bell} size={28} {weight} />{/each}
  </div>
  <div class="flex items-center gap-4">
    <Icon icon={ChatCircle} size={24} weight="duotone" class="text-brand" />
    <Icon icon={Gear} size={24} class="text-muted-foreground" />
    <Svg src={mark} class="size-7 text-brand" />
  </div>
</div>
