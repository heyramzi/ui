<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import { SLIDE_KEY, type SlideApi } from './types';

  type Props = {
    /** Reveal at this step. `1` is the first press of the arrow key. */
    step?: number;
    class?: string;
    style?: string;
    children?: Snippet;
  };

  let { step = 1, class: className, style, children }: Props = $props();

  const slide = getContext<SlideApi | undefined>(SLIDE_KEY);
  const visible = $derived(slide ? slide.isActive() && slide.activeStep() >= step : true);

  $effect(() => {
    if (!slide) return;
    return slide.registerFragment(step);
  });

  const rootClass = $derived(['deck-fragment', className].filter(Boolean).join(' '));
</script>

<span class={rootClass} style={style} data-visible={visible} aria-hidden={!visible}>
  {@render children?.()}
</span>

<style>
  .deck-fragment {
    display: block;
    opacity: 0;
    transform: translateY(0.75rem);
    transition:
      opacity 0.35s ease,
      transform 0.35s ease;
  }
  .deck-fragment[data-visible='true'] {
    opacity: 1;
    transform: none;
  }
</style>
