<script lang="ts">
  import { entries, groups } from "#lib/registry.js";
  import Tile from "#lib/Tile.svelte";
  import { page } from "$app/state";

  let filter = $state<string>("all");
  $effect(() => { filter = page.url.searchParams.get("g") ?? "all"; });
  const shown = $derived(filter === "all" ? entries : entries.filter((e) => e.group === filter));
</script>

<svelte:head><title>Components | heyramzi/ui</title></svelte:head>

<div class="mx-auto max-w-6xl px-6 pt-20">
  <h1 class="text-center text-4xl font-semibold tracking-tight sm:text-5xl">{entries.length} components, live</h1>
  <p class="mx-auto mt-4 max-w-lg text-center text-muted-foreground">Every one is a Svelte file you own. Open a tile to see it running and copy the source.</p>

  <div class="mt-8 flex justify-center gap-1.5">
    {#each [{ id: "all", label: "All" }, ...groups] as g (g.id)}
      <button
        class="rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors {filter === g.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:text-foreground'}"
        onclick={() => (filter = g.id)}>{g.label}</button>
    {/each}
  </div>

  <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {#each shown as entry (entry.slug)}<Tile {entry} />{/each}
  </div>
</div>
