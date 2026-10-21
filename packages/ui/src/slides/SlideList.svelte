<script lang="ts">
  import Slide from '#src/slides/Slide.svelte';
  import type { SlideInstance, SlideRegistry } from '#src/slides/model.js';

  interface Props { slides: SlideInstance[]; registry: SlideRegistry; unknownLabel: (type: string) => string };

  let { slides, registry, unknownLabel }: Props = $props();
</script>

{#each slides as slide (slide.id)}
  {@const definition = registry[slide.type]}
  <Slide label={definition?.label} notes={slide.notes} hidden={slide.hidden} align="bare">
    {#if definition}
      <definition.layout content={slide.content} {slide} />
    {:else}
      <p class="deck-body" style:padding="var(--deck-pad)">{unknownLabel(slide.type)}</p>
    {/if}
  </Slide>
{/each}
