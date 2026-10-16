<script lang="ts">
  import { entries } from "#lib/registry.js";
  import Viewer from "#lib/Viewer.svelte";
  const charts = entries.filter((e) => e.group === "charts");
</script>

<svelte:head><title>Charts | heyramzi/ui</title></svelte:head>

<div class="mx-auto max-w-5xl px-6 pt-20">
  <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Charts</h1>
  <p class="mt-4 max-w-xl text-muted-foreground">
    {charts.length} chart components on LayerChart, one set of tokens. Hover them. Switch to Code to copy one in.
  </p>
  <nav class="mt-6 flex flex-wrap gap-1.5">
    {#each charts as c (c.slug)}
      <a href="#{c.slug}" class="rounded-full border border-border bg-card px-3 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground">{c.title}</a>
    {/each}
  </nav>
  <div class="mt-10 flex flex-col gap-8">
    {#each charts as entry (entry.slug)}
      <div class="scroll-mt-24">
        <p class="mb-3 text-sm text-muted-foreground">{entry.description}</p>
        <Viewer {entry} link />
      </div>
    {/each}
  </div>
</div>
