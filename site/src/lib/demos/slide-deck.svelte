<script lang="ts">
  import { Deck, Slide, Fragment } from "@heyramzi/slides";

  let index = $state(0);
  let step = $state(0);
</script>

<div class="h-80 w-full overflow-hidden rounded-xl">
  <Deck bind:index bind:step theme="ink" label="Deck demo">
    <Slide label="Cover">
      <p class="text-xs uppercase tracking-widest opacity-60">Quarterly review</p>
      <h1 class="mt-2 text-2xl font-semibold">Numbers are up and to the right</h1>
      <p class="mt-2 text-sm opacity-70">Three slides on what shipped this quarter.</p>
    </Slide>
    <Slide label="Steps">
      <p class="text-xs uppercase tracking-widest opacity-60">Highlights</p>
      <ul class="mt-3 flex flex-col gap-2 text-sm">
        <Fragment step={1}><li>Launched the new pricing page</li></Fragment>
        <Fragment step={2}><li>Cut load time in half</li></Fragment>
        <Fragment step={3}><li>Published forty components</li></Fragment>
      </ul>
    </Slide>
  </Deck>
</div>
