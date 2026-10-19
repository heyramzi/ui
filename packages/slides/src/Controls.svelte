<script lang="ts">
  import type { DeckController } from './deck-controller.svelte';

  interface Props {
    deck: DeckController;
    /** Shown only when the deck has somewhere to open the presenter view. */
    onpresenter?: () => void;
    onfullscreen: () => void;
  };

  let { deck, onpresenter, onfullscreen }: Props = $props();

  const icons = {
    prev: 'M15 5 8 12l7 7',
    next: 'm9 5 7 7-7 7',
    overview: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z',
    presenter: 'M4 5h16v10H4zM8 19h8M12 15v4',
    fullscreen: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  };
</script>

{#snippet button(icon: keyof typeof icons, label: string, onclick: () => void, disabled = false, pressed?: boolean)}
  <button type="button" class="deck__button" {onclick} {disabled} aria-label={label} aria-pressed={pressed}>
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d={icons[icon]} fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
{/snippet}

<div class="deck__controls deck__chrome">
  {@render button('prev', deck.labels.previous, () => deck.prev(), deck.atStart)}
  <span class="deck__counter" aria-hidden="true">{deck.ordinal.n} / {deck.ordinal.of}</span>
  {@render button('next', deck.labels.next, () => deck.next(), deck.atEnd)}
  <span class="deck__divider" aria-hidden="true"></span>
  {@render button('overview', deck.labels.overview, () => deck.toggleOverview(), false, deck.overview)}
  {#if onpresenter}
    {@render button('presenter', deck.labels.presenter, onpresenter)}
  {/if}
  {@render button('fullscreen', deck.labels.fullscreen, onfullscreen)}
</div>

<style>
  .deck__controls {
    position: absolute;
    right: 12px;
    bottom: 14px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    color: var(--deck-fg);
    background: color-mix(in srgb, var(--deck-bg) 72%, transparent);
    border: 1px solid var(--deck-line);
    border-radius: 12px;
    backdrop-filter: blur(var(--blur-large, 8px));
    opacity: 0.55;
    transition: opacity var(--deck-t-quick) var(--deck-ease);
  }
  .deck__controls:focus-within {
    opacity: 1;
  }
  @media (hover: hover) and (pointer: fine) {
    .deck__controls:hover {
      opacity: 1;
    }
  }
  .deck__button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    transition:
      background-color var(--deck-t-quick) var(--deck-ease),
      transform var(--deck-t-quick) var(--deck-ease);
  }
  @media (hover: hover) and (pointer: fine) {
    .deck__button:hover:not(:disabled) {
      background: var(--deck-line);
    }
  }
  .deck__button:active:not(:disabled) {
    transform: scale(var(--scale-medium, 0.97));
  }
  .deck__button[aria-pressed='true'] {
    color: var(--deck-on-accent);
    background: var(--deck-accent);
  }
  .deck__button:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .deck__button:focus-visible {
    outline: 2px solid var(--deck-accent);
    outline-offset: 1px;
  }
  .deck__counter {
    min-width: 52px;
    font: 500 12px/1 var(--deck-font);
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--deck-muted);
  }
  .deck__divider {
    width: 1px;
    height: 16px;
    margin: 0 4px;
    background: var(--deck-line);
  }

  @media (hover: none) {
    .deck__controls {
      opacity: 0.9;
    }
  }
  /* On a small deck the controls shrink and drop the extras, so they don't cover the slide. */
  @container (max-width: 520px) {
    .deck__controls {
      right: 6px;
      bottom: 10px;
      padding: 2px;
    }
    .deck__button {
      width: 28px;
      height: 28px;
    }
    .deck__counter,
    .deck__divider {
      display: none;
    }
  }
</style>
