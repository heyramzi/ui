<script lang="ts">
  import { entries, packages } from "#lib/registry.js";
  import Tile from "#lib/Tile.svelte";

  const titles: Record<string, string> = {
    ui: "UI",
    board: "Board",
    agents: "Agents",
    slides: "Slides",
    draw: "Draw",
    marketing: "Marketing",
    review: "Review",
  };
</script>

<svelte:head><title>heyramzi/ui</title></svelte:head>

<section class="mx-auto max-w-4xl px-6 pb-10 pt-24 text-center">
  <p class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
    <span class="size-1.5 rounded-full bg-emerald-500"></span> Svelte 5 · Tailwind v4
  </p>
  <h1 class="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">Components for our product teams.</h1>
  <p class="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
    Svelte 5 building blocks for product teams. Seven packages, every one live below.
  </p>
</section>

{#each packages as pkg (pkg.id)}
  {@const tiles = entries.filter((e) => pkg.groups.includes(e.group))}
  <section class="mx-auto mt-16 max-w-6xl px-6">
    <div class="mb-6">
      <p class="font-mono text-sm text-muted-foreground">{pkg.name}</p>
      <h2 class="mt-1 text-2xl font-semibold tracking-tight">{titles[pkg.id] ?? pkg.name}</h2>
      <p class="mt-1 text-muted-foreground">{pkg.blurb}</p>
    </div>
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each tiles as entry (entry.slug)}<Tile {entry} />{/each}
    </div>
  </section>
{/each}

<div class="mx-auto max-w-6xl px-6 py-20"></div>
