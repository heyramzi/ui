<script lang="ts">
  import { AiButton, type AiStatus } from "@heyramzi/ui/ai/ai-button";

  let status = $state<AiStatus>("idle");
  let iconStatus = $state<AiStatus>("idle");

  function run(set: (s: AiStatus) => void) {
    set("processing");
    setTimeout(() => set("done"), 1800);
    setTimeout(() => set("idle"), 3200);
  }
</script>

<div class="flex items-center gap-4">
  <AiButton {status} label={status === "done" ? "Draft ready" : "Draft reply"} processingLabel="Drafting..." onclick={() => run((s) => (status = s))} />
  <AiButton variant="default" label="Summarize" status="idle" />
  <AiButton iconOnly status={iconStatus} onclick={() => run((s) => (iconStatus = s))} />
  <AiButton label="Generate" disabled />
</div>
