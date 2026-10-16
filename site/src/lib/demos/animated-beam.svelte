<script lang="ts">
  import { AnimatedBeam } from "@heyramzi/ui/effects/animated-beam";

  let container = $state<HTMLElement | null>(null);
  let from = $state<HTMLElement | null>(null);
  let to = $state<HTMLElement | null>(null);

  // Many beams fanning into one node.
  const labels = ["1", "2", "3"];
  const colors = ["#7B68EE", "#22d3ee", "#10b981"];
  let hubContainer = $state<HTMLElement | null>(null);
  let hub = $state<HTMLElement | null>(null);
  let sources = $state<HTMLElement[]>([]);
</script>

<div class="flex w-full max-w-md flex-col gap-6">
  <div bind:this={container} class="relative flex min-h-28 w-full items-center justify-between px-5">
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

  <div bind:this={hubContainer} class="relative grid min-h-36 w-full grid-cols-[auto_1fr] items-center gap-12 px-5">
    <div class="z-[1] flex flex-col gap-3">
      {#each labels as label, i (label)}
        <div bind:this={sources[i]} class="grid size-10 place-items-center rounded-xl border bg-card text-xs font-semibold" style="border-color: {colors[i]}55">{label}</div>
      {/each}
    </div>
    <div class="z-[1] flex justify-center">
      <div bind:this={hub} class="grid size-[3.25rem] place-items-center rounded-xl border border-[#6647f0]/40 bg-card text-xs font-semibold shadow-[0_0_0_4px_color-mix(in_oklab,#6647f0_10%,transparent)]">UI</div>
    </div>
    {#each labels as _, i (i)}
      {#if hubContainer && hub && sources[i]}
        <AnimatedBeam
          containerRef={hubContainer}
          fromRef={sources[i]}
          toRef={hub}
          fromAnchor="right"
          toAnchor="left"
          delay={i * 0.6}
          duration={4}
          gradientStartColor={colors[i]}
          gradientStopColor="#6647F0"
          pathColor="var(--muted-foreground)"
          pathOpacity={0.12}
        />
      {/if}
    {/each}
  </div>
</div>
