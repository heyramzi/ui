<script lang="ts">
  import type { Entry } from "#lib/registry.js";
  import EntryIcon from "#lib/EntryIcon.svelte";
  import { copyAiContext } from "#lib/ai-context.js";
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";

  let { entry }: { entry: Entry } = $props();
  let width = $state(0);
  let height = $state(0);
  let stage: HTMLDivElement;
  // Lay the demo out near the tile's own width, so one that fills its row is not drawn
  // at 760px and shrunk to a third. 400px keeps charts and forms from cramping.
  const stageWidth = $derived(width ? Math.min(760, Math.max(400, width - 48)) : 760);
  // The demo's own footprint, unscaled: offset sizes ignore the CSS scale.
  let content = $state({ w: 760, h: 0 });
  let copied = $state(false);
  // Shrink a demo only as far as it needs to fit. A small one stays at full size.
  const scale = $derived(
    width && content.h ? Math.min(1, (width - 48) / content.w, (height - 40) / content.h) : 0.46,
  );

  $effect(() => {
    const measure = () => {
      const kids = [...stage.children] as HTMLElement[];
      const left = Math.min(...kids.map((k) => k.offsetLeft));
      const right = Math.max(...kids.map((k) => k.offsetLeft + k.offsetWidth));
      const w = kids.length ? Math.max(1, right - left) : stageWidth;
      content = { w, h: Math.max(1, stage.offsetHeight) };
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const kid of stage.children) observer.observe(kid);
    measure();
    return () => observer.disconnect();
  });

  async function copy(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (await copyAiContext(entry)) {
      copied = true;
      setTimeout(() => (copied = false), 1600);
    }
  }
</script>

<a
  href="/components/{entry.slug}"
  class="group flex flex-col rounded-[26px] border border-border bg-card/60 p-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-xl"
>
  <div class="canvas-dots relative h-60 overflow-hidden rounded-[20px] border border-border bg-background" bind:clientWidth={width} bind:clientHeight={height}>
    <div class="pointer-events-none absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2" style="width:{stageWidth}px; scale:{scale}" aria-hidden="true">
      <div class="flex w-full justify-center" bind:this={stage}>
        <entry.component />
      </div>
    </div>
    <button
      type="button"
      class="absolute right-2 top-2 grid size-8 place-items-center rounded-lg border border-border bg-card/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      aria-label="Copy"
      title="Copy"
      onclick={copy}
    >
      {#if copied}<Check class="size-4 text-emerald-500" />{:else}<Copy class="size-4" />{/if}
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
