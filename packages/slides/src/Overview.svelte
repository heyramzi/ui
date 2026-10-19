<script lang="ts">
  import type { DeckController } from './deck-controller.svelte';

  interface Props { deck: DeckController; returnFocus?: HTMLElement };

  let { deck, returnFocus }: Props = $props();

  let tiles = $state<HTMLButtonElement[]>([]);

  /* Focus follows the cursor, so arrow keys and Tab agree on where you are. */
  $effect(() => {
    tiles[deck.cursor]?.focus({ preventScroll: true });
  });
  $effect(() => () => returnFocus?.focus({ preventScroll: true }));
</script>

<ol class="deck__tiles deck__chrome">
  {#each deck.visible as slideIndex, n (slideIndex)}
    {@const box = deck.grid.boxes[n]}
    {@const label = deck.entries[slideIndex]?.label}
    {#if box}
      <li
        class="deck__tile-cell"
        style:left="{box.x}px"
        style:top="{box.y}px"
        style:width="{deck.canvas.w * box.scale}px"
        style:height="{deck.canvas.h * box.scale}px"
      >
        <button
          bind:this={tiles[n]}
          type="button"
          class="deck__tile"
          tabindex={n === deck.cursor ? 0 : -1}
          aria-current={slideIndex === deck.position.index ? 'step' : undefined}
          aria-label={label ? `${deck.labels.slide(n + 1, deck.visible.length)}: ${label}` : deck.labels.slide(n + 1, deck.visible.length)}
          onclick={() => deck.select(slideIndex)}
          onfocus={() => (deck.cursor = n)}
        >
          <span class="deck__tile-n">{n + 1}</span>
        </button>
      </li>
    {/if}
  {/each}
</ol>

<style>
  .deck__tiles {
    position: absolute;
    inset: 0;
    z-index: 4;
    margin: 0;
    padding: 0;
    list-style: none;
    /* The ring and number appear once the thumbnails have landed. */
    animation: tiles-in var(--deck-t-quick) linear var(--deck-t-morph) backwards;
  }
  @keyframes tiles-in {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .deck__tiles {
      animation: none;
    }
  }
  .deck__tile-cell {
    position: absolute;
  }
  .deck__tile {
    position: absolute;
    inset: 0;
    padding: 0;
    color: var(--deck-fg);
    background: transparent;
    border: 0;
    border-radius: 10px;
    cursor: pointer;
    outline: 2px solid transparent;
    outline-offset: 3px;
    transition: outline-color var(--deck-t-quick) var(--deck-ease);
  }
  @media (hover: hover) and (pointer: fine) {
    .deck__tile:hover {
      outline-color: color-mix(in srgb, var(--deck-accent) 55%, transparent);
    }
  }
  .deck__tile[aria-current='step'] {
    outline-color: var(--deck-accent);
  }
  .deck__tile:focus-visible {
    outline-color: var(--deck-fg);
  }
  .deck__tile-n {
    position: absolute;
    bottom: -12px;
    left: 50%;
    min-width: 22px;
    transform: translateX(-50%);
    padding: 3px 6px;
    font: 600 11px/1 var(--deck-font);
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--deck-fg);
    background: var(--deck-bg);
    box-shadow: 0 0 0 1px var(--deck-line);
    border-radius: 6px;
  }
  .deck__tile[aria-current='step'] .deck__tile-n {
    color: var(--deck-on-accent);
    background: var(--deck-accent);
  }
</style>
