<script lang="ts">
  import { entries, groupLabel } from "#lib/registry.js";
  import Viewer from "#lib/Viewer.svelte";
  import Tile from "#lib/Tile.svelte";
  import { ArrowLeft } from "phosphor-svelte";

  let { data } = $props();
  const entry = $derived(data.entry);
  const related = $derived(entries.filter((e) => e.group === entry.group && e.slug !== entry.slug).slice(0, 3));
</script>

<svelte:head><title>{entry.title} | heyramzi/ui</title><meta name="description" content={entry.description} /></svelte:head>

<div class="mx-auto max-w-5xl px-6 pt-16">
  <a href="/components?g={entry.group}" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft class="size-4" /> Components</a>
  <h1 class="mt-4 text-4xl font-semibold tracking-tight">{entry.title}</h1>
  <p class="mt-2 max-w-xl text-muted-foreground">{entry.description}</p>
  <div class="mt-8">{#key entry.slug}<Viewer {entry} />{/key}</div>

  <h2 class="mb-4 mt-16 text-lg font-semibold">More {groupLabel(entry.group).toLowerCase()}</h2>
  <div class="grid gap-5 sm:grid-cols-3">{#each related as r (r.slug)}<Tile entry={r} />{/each}</div>
</div>
