<script lang="ts">
  import { bySlug, categoryId } from "#lib/registry.js";
  import Tile from "#lib/Tile.svelte";
  import { ArrowRight } from "phosphor-svelte";

  let { data } = $props();
  const section = $derived(data.section);
  const count = $derived(section.categories.reduce((n, c) => n + c.items.length, 0));
</script>

<svelte:head><title>{section.title} | heyramzi/ui</title></svelte:head>

<div class="py-12">
  <h1 class="text-4xl font-semibold tracking-tight">{section.title}</h1>
  <p class="mt-2 text-sm text-muted-foreground">{count} parts</p>

  {#each section.categories as category (category.title)}
    <section class="mt-14" aria-labelledby={categoryId(category.title)}>
      <h2 id={categoryId(category.title)} class="mb-5 scroll-mt-24 text-lg font-semibold tracking-tight">{category.title}</h2>
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {#each category.items as item (typeof item === "string" ? item : item.href)}
          {#if typeof item === "string"}
            <Tile entry={bySlug(item)!} />
          {:else}
            <a href={item.href} class="group flex min-h-24 items-center justify-between rounded-[26px] border border-dashed border-border p-5 text-[14px] font-medium transition-colors hover:border-foreground/30">
              {item.title}
              <ArrowRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          {/if}
        {/each}
      </div>
    </section>
  {/each}
</div>
