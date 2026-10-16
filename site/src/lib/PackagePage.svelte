<script lang="ts">
  import type { Snippet } from "svelte";
  let { name, title, blurb, children }: { name: string; title: string; blurb: string; children: Snippet } = $props();
</script>

<svelte:head><title>{title} | heyramzi/ui</title><meta name="description" content={blurb} /></svelte:head>

<div class="mx-auto max-w-5xl px-6 pt-20">
  <p class="font-mono text-sm text-muted-foreground">{name}</p>
  <h1 class="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
  <p class="mt-4 max-w-xl text-muted-foreground">{blurb}</p>
  <div class="mt-10">
    {@render children()}
  </div>
</div>
