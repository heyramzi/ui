<script lang="ts">
  import { getContext, setContext, type Snippet } from 'svelte';
  import { DECK_KEY, SLIDE_KEY, type DeckApi, type SlideApi } from './types';

  type Props = {
    /** Accessible name for the slide. */
    label?: string;
    class?: string;
    style?: string;
    children?: Snippet;
  };

  let { label, class: className, style, children }: Props = $props();

  const deck = getContext<DeckApi | undefined>(DECK_KEY);
  if (!deck) throw new Error('<Slide> must be rendered inside <Deck>.');

  const id = Symbol('slide');

  /* Fragments register their step here. The slide's step count is the highest
     step any fragment asked for, so the deck can walk them before advancing. */
  const counts = new Map<number, number>();
  let steps = $state(0);

  function recompute() {
    steps = counts.size ? Math.max(...counts.keys()) : 0;
  }

  function registerFragment(fragmentStep: number) {
    counts.set(fragmentStep, (counts.get(fragmentStep) ?? 0) + 1);
    recompute();
    return () => {
      const left = (counts.get(fragmentStep) ?? 1) - 1;
      if (left <= 0) counts.delete(fragmentStep);
      else counts.set(fragmentStep, left);
      recompute();
    };
  }

  const active = $derived(deck.isActive(id));

  const slideApi: SlideApi = {
    isActive: () => active,
    activeStep: () => (active ? deck.step() : 0),
    registerFragment,
  };
  setContext(SLIDE_KEY, slideApi);

  $effect(() => deck.registerSlide(id, () => steps));

  const rootClass = $derived(['slide', className].filter(Boolean).join(' '));
</script>

<section
  class={rootClass}
  style={style}
  data-active={active}
  aria-hidden={!active}
  inert={!active}
  aria-label={label}
>
  <div class="slide__inner">
    {@render children?.()}
  </div>
</section>

<style>
  .slide {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--deck-pad);
    opacity: 0;
    visibility: hidden;
    transform: translateY(1.5%);
    transition:
      opacity 0.45s ease,
      transform 0.45s ease,
      visibility 0.45s;
  }
  .slide[data-active='true'] {
    opacity: 1;
    visibility: visible;
    transform: none;
  }
  .slide__inner {
    width: 100%;
    max-width: 58rem;
    text-align: center;
  }
</style>
