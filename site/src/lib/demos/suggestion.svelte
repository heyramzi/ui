<script lang="ts">
  import { Suggestions, Suggestion } from "@heyramzi/ui/ai/suggestion";
  import { Input } from "@heyramzi/ui/shadcn/input";

  const ideas = [
    "Chase the unpaid invoices",
    "Draft a quote for Acme Freight",
    "Who hasn't replied this week?",
    "Plan Thursday's client call",
  ];

  let value = $state("");
</script>

<div class="flex w-full max-w-2xl flex-col gap-3">
  <Suggestions>
    {#each ideas as idea (idea)}
      <Suggestion suggestion={idea} onclick={(s) => (value = s)} />
    {/each}
  </Suggestions>
  <Input bind:value placeholder="Ask anything..." aria-label="Prompt" />
</div>
