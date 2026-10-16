<script lang="ts">
  import { entries, packages } from "#lib/registry.js";
  import PackageHeading from "#lib/PackageHeading.svelte";
  import Tile from "#lib/Tile.svelte";

  // Land on the section a shared link names. The browser and the router both scroll to the hash,
  // but they do it before the web fonts load and the page grows, so scroll again once it has settled.
  $effect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    let cancelled = false;
    const settled = document.fonts?.ready ?? Promise.resolve();
    settled.then(() => {
      if (!cancelled) document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:head><title>heyramzi/ui</title></svelte:head>

<section class="mx-auto max-w-4xl px-6 pb-10 pt-24 text-center">
  <p class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
    <span class="size-1.5 rounded-full bg-emerald-500"></span> Svelte 5 · Tailwind v4
  </p>
  <h1 class="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">Components for our product teams.</h1>
  <p class="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
    Svelte 5 building blocks for product teams. Every package is live below.
  </p>
  <nav aria-label="Packages" class="mt-8 flex flex-wrap justify-center gap-1.5">
    {#each packages as pkg (pkg.id)}
      <a href="#{pkg.id}" class="rounded-full border border-border bg-card px-3 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground">{pkg.title}</a>
    {/each}
  </nav>
</section>

{#each packages as pkg (pkg.id)}
  {@const tiles = entries.filter((e) => e.pkg === pkg.id)}
  <section class="mx-auto mt-16 max-w-6xl px-6" aria-labelledby={pkg.id}>
    <PackageHeading id={pkg.id} name={pkg.name} title={pkg.title} blurb={pkg.blurb} />
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each tiles as entry (entry.slug)}<Tile {entry} />{/each}
    </div>
  </section>
{/each}

<div class="mx-auto max-w-6xl px-6 py-20"></div>
