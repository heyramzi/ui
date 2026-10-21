<script lang="ts">
  import { List, SquaresFour, Plus } from "phosphor-svelte";
  import { Toolbar } from "@heyramzi/ui/components/toolbar";
  import { Button } from "@heyramzi/ui/shadcn/button";

  const tabs = [
    { value: "all", label: "All", count: 24 },
    { value: "open", label: "Open", count: 9 },
    { value: "done", label: "Done", count: 15 },
  ];
  const views = [
    { value: "list", label: "List", icon: List },
    { value: "grid", label: "Grid", icon: SquaresFour },
  ];

  let search = $state("");
  let tab = $state("all");
  let view = $state("list");
</script>

<div class="flex flex-col gap-6">
  <!-- The same toolbar in two panes. It reads its own width, not the screen's. -->
  <div class="flex flex-col gap-2">
    <p class="text-xs text-muted-foreground">A 720px pane: search, tabs and view sit on the row.</p>
    <div class="w-[720px] max-w-full rounded-lg border border-border bg-card p-3">
      <Toolbar bind:search bind:tab bind:view {tabs} {views}>
        {#snippet actions()}
          <Button size="sm"><Plus /> New</Button>
        {/snippet}
      </Toolbar>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <p class="text-xs text-muted-foreground">A 340px pane: the same row, with each of the three folded into a menu.</p>
    <div class="w-[340px] max-w-full rounded-lg border border-border bg-card p-3">
      <Toolbar bind:search bind:tab bind:view {tabs} {views}>
        {#snippet actions()}
          <Button size="sm" icon aria-label="New"><Plus /></Button>
        {/snippet}
      </Toolbar>
    </div>
  </div>
</div>
