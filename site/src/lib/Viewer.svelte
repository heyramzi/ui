<script lang="ts">
  import type { Entry } from "#lib/registry.js";
  import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
  import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";
  import { copyAiContext } from "#lib/ai-context.js";
  import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
  import { ArrowCounterClockwise, Check, Copy } from "phosphor-svelte";

  let { entry, link = false }: { entry: Entry; link?: boolean } = $props();

  const views = [
    { value: "preview", label: "Preview" },
    { value: "code", label: "Code" },
  ] as const;

  let tab = $state<(typeof views)[number]["value"]>("preview");
  let run = $state(0);
  let copied = $state(false);
  const lines = useHighlightedCode(() => entry.source, () => "svelte");

  // One button, the full block: usage and component source. A person pastes the
  // part they want, an agent gets everything.
  async function copy() {
    if (await copyAiContext(entry)) {
      copied = true;
      setTimeout(() => (copied = false), 1600);
    }
  }
</script>

<section id={entry.slug} class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
  <header class="flex items-center gap-3 border-b border-border px-4 py-2.5">
    <SegmentedFilter options={views} bind:value={tab} ariaLabel="View" block={false} />
    {#if link}
      <a href="/components/{entry.slug}" class="ml-1 text-sm font-medium hover:underline">{entry.title}</a>
    {/if}
    <div class="ml-auto flex items-center gap-1">
      <button class="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Replay" onclick={() => run++}>
        <ArrowCounterClockwise class="size-4" />
      </button>
      <button class="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onclick={copy}>
        {#if copied}<Check class="size-4 text-emerald-500" /> Copied{:else}<Copy class="size-4" /> Copy{/if}
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
    <CodeBlock.Root class="rounded-none border-0">
      <CodeBlock.Content class="max-h-[560px]" style="min-height:{Math.min(entry.height ?? 280, 320)}px">
        {#each lines.current as line, index (index)}
          <CodeBlock.Line code={line} />
        {/each}
      </CodeBlock.Content>
    </CodeBlock.Root>
  {/if}
</section>
