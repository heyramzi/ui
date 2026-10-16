<script lang="ts">
  import type { Snippet } from "svelte";
  import { entries, packageById } from "#lib/registry.js";
  import Viewer from "#lib/Viewer.svelte";

  // One package's page. Name, title and blurb come from `packages` in the registry. With no
  // children it lists the package's demos, each in a Viewer, with jump links once there are a few.
  let { id, blurb, children }: { id: string; blurb?: string; children?: Snippet } = $props();
  const pkg = $derived(packageById(id));
  const demos = $derived(entries.filter((e) => e.pkg === id));
</script>

<svelte:head><title>{pkg.title} | heyramzi/ui</title><meta name="description" content={blurb ?? pkg.blurb} /></svelte:head>

<div class="mx-auto max-w-5xl px-6 pt-20">
  <p class="font-mono text-sm text-muted-foreground print:hidden">{pkg.name}</p>
  <h1 class="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl print:hidden">{pkg.title}</h1>
  <p class="mt-4 max-w-xl text-muted-foreground print:hidden">{blurb ?? pkg.blurb}</p>
  {#if children}
    <div class="mt-10">{@render children()}</div>
  {:else}
    {#if demos.length > 3}
      <nav class="mt-6 flex flex-wrap gap-1.5">
        {#each demos as d (d.slug)}
          <a href="#{d.slug}" class="rounded-full border border-border bg-card px-3 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground">{d.title}</a>
        {/each}
      </nav>
    {/if}
    <div class="mt-10 flex flex-col gap-8">
      {#each demos as entry (entry.slug)}
        <div class="scroll-mt-24">
          <p class="mb-3 text-sm text-muted-foreground">{entry.description}</p>
          <Viewer {entry} link />
        </div>
      {/each}
    </div>
  {/if}
</div>
