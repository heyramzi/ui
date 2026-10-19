<script lang="ts">
  import { getContext, type Snippet } from 'svelte';
  import { SLIDE_KEY, type SlideContext } from '#src/types.js';

  interface Props {
    /** Reveal at this step. `1` is the first press of the arrow key. */
    step?: number;
    /** How it arrives: `rise` (default), `fade` or `scale`. */
    reveal?: 'rise' | 'fade' | 'scale';
    /** The element to render, so a fragment can be an `li` inside a `ul`. */
    as?: string;
    class?: string;
    style?: string;
    children?: Snippet;
  };

  let { step = 1, reveal = 'rise', as: tag = 'div', class: className, style, children }: Props = $props();

  const slide = getContext<SlideContext | undefined>(SLIDE_KEY);
  const visible = $derived(slide ? slide.shown(step) : true);

  /* Fragments that share a step arrive one after another, in the order they mounted. */
  let order = $state(0);
  $effect(() => {
    if (!slide) return;
    const joined = slide.join(step);
    order = joined.order;
    return joined.leave;
  });
</script>

<svelte:element
  this={tag}
  class={['deck-fragment', className]}
  {style}
  style:--frag-i={order}
  data-reveal={reveal}
  data-visible={visible}
  aria-hidden={!visible}
  inert={!visible}
>
  {@render children?.()}
</svelte:element>

<style>
  .deck-fragment {
    opacity: 0;
    transition:
      opacity var(--deck-t-slide) var(--deck-ease),
      transform var(--deck-t-slide) var(--deck-ease);
  }
  .deck-fragment[data-reveal='rise'] {
    transform: translateY(var(--deck-shift));
  }
  .deck-fragment[data-reveal='scale'] {
    transform: scale(var(--scale-large, 0.96));
  }
  .deck-fragment[data-visible='true'] {
    opacity: 1;
    transform: none;
    transition-delay: calc(var(--frag-i) * var(--deck-stagger));
  }

  @media (prefers-reduced-motion: reduce) {
    .deck-fragment {
      transform: none !important;
      transition: opacity var(--deck-t-quick) linear;
      transition-delay: 0s !important;
    }
  }
</style>
