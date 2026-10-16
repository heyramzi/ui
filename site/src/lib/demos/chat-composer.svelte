<script lang="ts">
  import { Composer } from "@heyramzi/ui/ai";

  let value = $state("");
  let sent = $state<string[]>(["When does the release go out?"]);

  function submit() {
    if (!value.trim()) return;
    sent = [...sent, value.trim()];
    value = "";
  }
</script>

<div class="flex w-full max-w-md flex-col gap-3">
  <ul class="flex flex-col gap-1.5">
    {#each sent as message (message)}
      <li class="self-end rounded-2xl rounded-br-sm bg-foreground px-3.5 py-2 text-sm text-background">{message}</li>
    {/each}
  </ul>
  <Composer bind:value onSubmit={submit} placeholder="Write a message..." />
</div>
