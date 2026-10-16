<script lang="ts">
  import { entries } from "#lib/registry.js";
  import Viewer from "#lib/Viewer.svelte";
  const demos = entries.filter((e) => e.group === "marketing");
</script>

<svelte:head><title>Marketing | heyramzi/ui</title></svelte:head>

<div class="mx-auto max-w-5xl px-6 pt-20">
  <p class="font-mono text-sm text-muted-foreground">@heyramzi/marketing</p>
  <h1 class="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Marketing</h1>
  <p class="mt-4 max-w-xl text-muted-foreground">
    Brand tokens and testimonials you can see below. The package also ships Umami analytics, Sentry errors and an HTML-to-image pipeline, which run on the server and have nothing to show here.
  </p>
  <div class="mt-10 flex flex-col gap-8">
    {#each demos as entry (entry.slug)}
      <div class="scroll-mt-24">
        <p class="mb-3 text-sm text-muted-foreground">{entry.description}</p>
        <Viewer {entry} link />
      </div>
    {/each}
  </div>
</div>
