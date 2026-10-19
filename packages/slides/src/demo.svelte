<script lang="ts">
  import Deck from './Deck.svelte';
  import type { DeckController } from './deck-controller.svelte';
  import DemoSlides, { demoStyle } from './demo-slides.svelte';
  import type { DeckTheme, DeckTransition } from './types';

  interface Props {
    /** Where the presenter view is mounted. Leave out to hide the button. */
    presenter?: string;
  };

  let { presenter }: Props = $props();

  const themes: DeckTheme[] = ['ink', 'paper', 'auto'];
  const transitions: DeckTransition[] = ['fade', 'slide', 'zoom', 'morph'];

  let theme = $state<DeckTheme>('ink');
  let transition = $state<DeckTransition>('fade');
  let deck = $state<DeckController>();
</script>

<div class="demo">
  <div class="demo__bar">
    <div class="demo__group" role="radiogroup" aria-label="Theme">
      {#each themes as option (option)}
        <button
          type="button"
          role="radio"
          aria-checked={theme === option}
          class="demo__option"
          onclick={() => (theme = option)}>{option}</button
        >
      {/each}
    </div>
    <label class="demo__field">
      <span>Transition</span>
      <select bind:value={transition}>
        {#each transitions as option (option)}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <div class="demo__actions">
      <button type="button" class="demo__action" onclick={() => deck?.toggleOverview()}>Overview</button>
      {#if presenter}
        <a class="demo__action" href={presenter} target="heyramzi-slides-demo-presenter">Presenter</a>
      {/if}
      <button type="button" class="demo__action" onclick={() => window.print()}>Print</button>
    </div>
  </div>

  <div class="demo__stage">
    <Deck
      bind:controller={deck}
      id="slides-demo"
      title="Slides demo"
      sync="slides-demo"
      urlSync={false}
      {theme}
      {transition}
      {presenter}
      style={demoStyle}
    >
      <DemoSlides />
    </Deck>
  </div>
</div>

<style>
  .demo {
    display: grid;
    gap: 14px;
    width: 100%;
  }

  .demo__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    font-size: 13px;
  }
  .demo__group {
    display: inline-flex;
    padding: 3px;
    background: color-mix(in srgb, currentColor 7%, transparent);
    border-radius: 10px;
  }
  .demo__option {
    padding: 5px 12px;
    font: inherit;
    font-weight: 500;
    color: inherit;
    text-transform: capitalize;
    background: transparent;
    border: 0;
    border-radius: 7px;
    opacity: 0.65;
    cursor: pointer;
    transition:
      background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out),
      opacity var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
  }
  @media (hover: hover) and (pointer: fine) {
    .demo__option:hover {
      opacity: 1;
    }
  }
  .demo__option[aria-checked='true'] {
    background: color-mix(in srgb, currentColor 14%, transparent);
    opacity: 1;
  }
  .demo__field {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    opacity: 0.85;
  }
  .demo__field select {
    padding: 5px 8px;
    font: inherit;
    color: inherit;
    text-transform: capitalize;
    background: color-mix(in srgb, currentColor 7%, transparent);
    border: 0;
    border-radius: 8px;
  }
  .demo__actions {
    display: inline-flex;
    gap: 6px;
    margin-left: auto;
  }
  .demo__action {
    padding: 6px 12px;
    font: inherit;
    font-weight: 500;
    color: inherit;
    text-decoration: none;
    background: transparent;
    border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
    border-radius: 8px;
    cursor: pointer;
    transition: background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease-out);
  }
  @media (hover: hover) and (pointer: fine) {
    .demo__action:hover {
      background: color-mix(in srgb, currentColor 8%, transparent);
    }
  }
  .demo__option:focus-visible,
  .demo__action:focus-visible,
  .demo__field select:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .demo__stage {
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 14%, transparent);
  }

  @media print {
    .demo {
      display: block;
    }
    .demo__bar {
      display: none;
    }
    .demo__stage {
      overflow: visible;
      border-radius: 0;
      box-shadow: none;
    }
  }
</style>
