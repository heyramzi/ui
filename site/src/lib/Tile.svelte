<script lang="ts">
  import type { Entry } from "#lib/registry.js";
  import EntryIcon from "#lib/EntryIcon.svelte";
  import { copyAiContext } from "#lib/ai-context.js";
  import Check from "@lucide/svelte/icons/check";
  import Sparkles from "@lucide/svelte/icons/sparkles";

  let { entry }: { entry: Entry } = $props();
  let width = $state(0);
  let copiedAi = $state(false);
  const scale = $derived(width ? Math.min((width - 56) / 760, 0.75) : 0.46);

  async function copyAi(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (await copyAiContext(entry)) {
      copiedAi = true;
      setTimeout(() => (copiedAi = false), 1600);
    }
  }
</script>

<a
  href="/components/{entry.slug}"
  class="group flex flex-col rounded-[26px] border border-border bg-card/60 p-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-xl"
>
  <div class="canvas-dots relative h-60 overflow-hidden rounded-[20px] border border-border bg-background" bind:clientWidth={width}>
    <div class="pointer-events-none absolute left-1/2 top-1/2 w-[760px] origin-center -translate-x-1/2 -translate-y-1/2" style="scale:{scale}" aria-hidden="true">
      <div class="flex w-full justify-center">
        <entry.component />
      </div>
    </div>
    <button
      type="button"
      class="absolute right-2 top-2 grid size-8 place-items-center rounded-lg border border-border bg-card/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      aria-label="Copy for AI"
      title="Copy for AI"
      onclick={copyAi}
    >
      {#if copiedAi}<Check class="size-4 text-emerald-500" />{:else}<Sparkles class="size-4" />{/if}
    </button>
  </div>
  <div class="flex items-center gap-3 p-2.5 pt-3">
    <span class="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted text-muted-foreground transition-colors group-hover:text-foreground"><EntryIcon icon={entry.icon} /></span>
    <div class="min-w-0">
      <p class="text-[14px] font-medium leading-tight">{entry.title}</p>
      <p class="truncate text-[13px] text-muted-foreground">{entry.description}</p>
    </div>
  </div>
</a>
