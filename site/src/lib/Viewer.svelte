<script lang="ts">
  import type { Entry } from "#lib/registry.js";
  import { highlight } from "#lib/highlight.js";
  import { copyAiContext } from "#lib/ai-context.js";
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Sparkles from "@lucide/svelte/icons/sparkles";

  let { entry, link = false }: { entry: Entry; link?: boolean } = $props();

  let tab = $state<"preview" | "code">("preview");
  let run = $state(0);
  let copied = $state(false);
  let copiedAi = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.source);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {}
  }

  async function copyAi() {
    if (await copyAiContext(entry)) {
      copiedAi = true;
      setTimeout(() => (copiedAi = false), 1600);
    }
  }
</script>

<section id={entry.slug} class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
  <header class="flex items-center gap-3 border-b border-border px-4 py-2.5">
    <div class="flex rounded-lg bg-muted p-0.5 text-[13px] font-medium" role="tablist">
      {#each ["preview", "code"] as t (t)}
        <button
          role="tab"
          aria-selected={tab === t}
          class="rounded-md px-3 py-1 capitalize transition-colors {tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => (tab = t as typeof tab)}>{t}</button
        >
      {/each}
    </div>
    {#if link}
      <a href="/components/{entry.slug}" class="ml-1 text-sm font-medium hover:underline">{entry.title}</a>
    {/if}
    <div class="ml-auto flex items-center gap-1">
      <button class="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Replay" onclick={() => run++}>
        <RotateCcw class="size-4" />
      </button>
      <button class="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onclick={copy}>
        {#if copied}<Check class="size-4 text-emerald-500" /> Copied{:else}<Copy class="size-4" /> Copy{/if}
      </button>
      <button class="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onclick={copyAi}>
        {#if copiedAi}<Check class="size-4 text-emerald-500" /> Copied{:else}<Sparkles class="size-4" /> Copy for AI{/if}
      </button>
    </div>
  </header>

  {#if tab === "preview"}
    <div class="canvas-dots grid place-items-center overflow-x-auto p-6 sm:p-10" style="min-height:{entry.height ?? 280}px">
      {#key run}
        <div class="w-full">
          <div class="mx-auto flex w-full justify-center">
            <entry.component />
          </div>
        </div>
      {/key}
    </div>
  {:else}
    <pre class="code-block max-h-[560px] overflow-auto bg-muted/40 p-5 font-mono text-[13px] leading-relaxed" style="min-height:{Math.min(entry.height ?? 280, 320)}px"><code>{@html highlight(entry.source)}</code></pre>
  {/if}
</section>
