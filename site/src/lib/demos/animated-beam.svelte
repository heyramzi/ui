<script lang="ts">
  import { AnimatedBeam } from "@heyramzi/ui/effects/animated-beam";

  let container = $state<HTMLElement | null>(null);
  let from = $state<HTMLElement | null>(null);
  let to = $state<HTMLElement | null>(null);
</script>

<div bind:this={container} class="relative flex min-h-28 w-full max-w-md items-center justify-between px-5">
  <div bind:this={from} class="z-[1] grid size-11 place-items-center rounded-xl border border-border bg-card text-xs font-semibold">A</div>
  <div bind:this={to} class="z-[1] grid size-11 place-items-center rounded-xl border border-border bg-card text-xs font-semibold">B</div>
  {#if container && from && to}
    <AnimatedBeam
      containerRef={container}
      fromRef={from}
      toRef={to}
      fromAnchor="right"
      toAnchor="left"
      gradientStartColor="#6647F0"
      gradientStopColor="#22d3ee"
      pathColor="var(--muted-foreground)"
    />
  {/if}
</div>
