<script lang="ts">
  import { DocPage } from "@heyramzi/ui/components/docs";
  import { Lightbulb } from "phosphor-svelte";

  const sections = [
    { id: "what-worked", label: "What worked", body: "Splitting the call in two: the business logic first, then the tool on screen. Everyone had the whole picture before any detail landed." },
    { id: "what-to-fix", label: "What to fix", body: "The specs weren't clear enough before the call. Refine the task descriptions before the kickoff, not after it." },
    { id: "access", label: "Access on day one", body: "Spaces weren't shared and the field manager wouldn't open. Check workspace access during onboarding." },
    { id: "reusable", label: "What became reusable", body: "Three-layer time aggregation, threshold alerts and the invoice cap with carryover." },
  ];
</script>

<div class="flex h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-background">
  <DocPage
    title="Learnings"
    summary="What engagements taught"
    icon={Lightbulb}
    section="Patterns and learnings"
    updated="Updated 20 Oct 2026"
    headings={sections.map(({ id, label }) => ({ id, label }))}
    contentsLabel="On this page"
  >
    {#each sections as s (s.id)}
      <h2 id={s.id} class="mt-8 mb-3 font-heading text-lg font-semibold text-foreground first:mt-0">{s.label}</h2>
      <p class="mb-24 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
    {/each}
  </DocPage>
</div>
