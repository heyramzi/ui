<script lang="ts">
  import { getContext, setContext, type Snippet } from 'svelte';
  import type { DeckController, SlideEntry } from './deck-controller.svelte';
  import { DECK_KEY, SLIDE_KEY, type SlideAlign, type SlideContext, type SlideNotes } from './types';

  interface Props {
    /** Accessible name, read after "Slide 3 of 12". */
    label?: string;
    /** Speaker notes for the presenter view. */
    notes?: SlideNotes;
    /** Skipped by paging and left out of the overview and print. */
    hidden?: boolean;
    /** `center` (default), `start`, or `bare` to lay the canvas out yourself. */
    align?: SlideAlign;
    class?: string;
    style?: string;
    children?: Snippet;
  };

  let { label, notes, hidden = false, align = 'center', class: className, style, children }: Props = $props();

  const deck = getContext<DeckController | undefined>(DECK_KEY);
  if (!deck) throw new Error('<Slide> must be rendered inside <Deck>.');

  let el = $state<HTMLElement | null>(null);
  let steps = $state(0);
  /* Fragments per step, so one leaving doesn't drop a step another still asks for. */
  const counts = new Map<number, number>();

  const entry: SlideEntry = {
    id: Symbol('slide'),
    get steps() {
      return steps;
    },
    get hidden() {
      return hidden;
    },
    get label() {
      return label;
    },
    get notes() {
      return notes;
    },
    get el() {
      return el;
    },
  };

  $effect(() => deck.register(entry));

  const index = $derived(deck.entries.indexOf(entry));
  const active = $derived(index >= 0 && deck.position.index === index);
  const box = $derived(deck.boxOf(index));
  const order = $derived(Math.max(0, deck.visible.indexOf(index)));

  /* A slide that is leaving keeps the step it left at, so its fragments don't vanish mid-fade. */
  let held = $state(0);
  $effect.pre(() => {
    if (active) held = deck.position.step;
  });

  const recount = () => (steps = counts.size ? Math.max(...counts.keys()) : 0);

  setContext<SlideContext>(SLIDE_KEY, {
    shown: (step) => deck.revealAll || step <= (active ? deck.position.step : held),
    join(step) {
      const order = counts.get(step) ?? 0;
      counts.set(step, order + 1);
      recount();
      return {
        order,
        leave() {
          const left = (counts.get(step) ?? 1) - 1;
          if (left <= 0) counts.delete(step);
          else counts.set(step, left);
          recount();
        },
      };
    },
  });

  /* A View Transition needs one element per name, so only the active slide holds its morph names. */
  $effect(() => {
    const names = el?.querySelectorAll<HTMLElement>('[data-morph]') ?? [];
    for (const node of names) node.style.viewTransitionName = active ? (node.dataset.morph ?? '') : '';
  });

  const where = $derived(deck.labels.slide(order + 1, deck.visible.length));
  const name = $derived(label ? `${where}: ${label}` : where);
</script>

<section
  bind:this={el}
  class={['slide', className]}
  style:--slide-w="{deck.canvas.w}px"
  style:--slide-h="{deck.canvas.h}px"
  style:--slide-scale={box?.scale}
  style:--i={order}
  style:transform={box ? `translate3d(${box.x}px, ${box.y}px, 0) scale(${box.scale})` : undefined}
  {style}
  {hidden}
  data-active={active}
  role="group"
  aria-roledescription={deck.labels.slideRole}
  aria-label={name}
  aria-hidden={!active}
  inert={!active || deck.overview}
>
  <div class="slide__surface" data-align={align}>
    {@render children?.()}
  </div>
</section>

<style>
  /* The box is a full canvas, moved and scaled from its top-left. */
  .slide {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: var(--slide-w);
    height: var(--slide-h);
    transform-origin: 0 0;
    visibility: hidden;
    /* The old slide stays drawn for the length of the enter animation. */
    transition: visibility 0s linear var(--deck-t-slide);
  }
  .slide[hidden] {
    display: none;
  }
  .slide[data-active='true'] {
    z-index: 2;
    visibility: visible;
    transition-delay: 0s;
  }

  /* The overview shows every slide. They all leave the stack at once and settle in turn, later ones slower. */
  :global(.deck[data-view='overview']) .slide {
    visibility: visible;
  }
  :global(.deck[data-morphing]) .slide {
    transition:
      visibility 0s linear calc(var(--deck-t-morph) + 10 * var(--deck-stagger)),
      transform calc(var(--deck-t-morph) + min(var(--i), 10) * var(--deck-stagger)) var(--deck-ease);
  }
  /* Opening shows the slides at once, so only closing waits before hiding them. */
  :global(.deck[data-morphing][data-view='overview']) .slide {
    transition-delay: 0s;
  }

  .slide__surface {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: var(--deck-fg);
    background: var(--deck-bg);
    font-family: var(--deck-font);
    animation: var(--deck-t-slide) var(--deck-ease) backwards;
  }
  :global(.deck[data-view='overview']) .slide__surface {
    /* Design px, so divide by the scale to get the same corner on every thumbnail. */
    border-radius: calc(10px / var(--slide-scale, 1));
    box-shadow: 0 0 0 calc(1px / var(--slide-scale, 1)) var(--deck-line);
  }

  .slide__surface[data-align='center'],
  .slide__surface[data-align='start'] {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--deck-pad);
  }
  .slide__surface[data-align='center'] {
    align-items: center;
    text-align: center;
  }
</style>
