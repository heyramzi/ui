<script lang="ts">
  import Deck from './Deck.svelte';
  import Slide from './Slide.svelte';
  import Fragment from './Fragment.svelte';
  import type { DeckTheme } from './types';

  let index = $state(0);
  let step = $state(0);
  let theme = $state<DeckTheme>('ink');
</script>

<div class="demo">
  <div class="demo__bar">
    <div class="demo__brand">@heyramzi/slides</div>
    <div class="demo__tools">
      <span class="demo__status">slide {index + 1} · step {step}</span>
      <button
        type="button"
        class="demo__toggle"
        onclick={() => (theme = theme === 'ink' ? 'paper' : 'ink')}
      >
        {theme === 'ink' ? 'Paper theme' : 'Ink theme'}
      </button>
    </div>
  </div>

  <div class="demo__stage">
    <Deck bind:index bind:step {theme} label="Slides demo">
      <Slide label="Cover">
        <p class="deck-eyebrow">Svelte 5</p>
        <h1 class="deck-title">
          Presentations that
          <span class="deck-named">live in your app</span>
        </h1>
        <p class="deck-body">
          A deck is components. Keyboard, swipe and fragments come with it. Themes are CSS
          variables, so one prop reskins the room.
        </p>
      </Slide>

      <Slide label="Why">
        <p class="deck-eyebrow">01 / Why</p>
        <h1 class="deck-title">Three ideas</h1>
        <hr class="deck-rule" />
        <ul class="deck-grid">
          <li class="deck-card">
            <h3>Real components</h3>
            <p>Slides are Svelte, so every state, chart and animation already works.</p>
          </li>
          <li class="deck-card">
            <h3>No build step</h3>
            <p>Copy the source in. It runs wherever Svelte 5 runs.</p>
          </li>
          <li class="deck-card">
            <h3>Print to PDF</h3>
            <p>One print stylesheet turns the deck into pages, controls hidden.</p>
          </li>
        </ul>
      </Slide>

      <Slide label="Fragments">
        <p class="deck-eyebrow">02 / Steps</p>
        <h1 class="deck-title">Reveal on cue</h1>
        <p class="deck-body">The arrow key walks a slide's fragments before it moves on.</p>
        <ul class="deck-grid">
          <li class="deck-card">
            <Fragment step={1}>
              <h3>First</h3>
              <p>Press the right arrow and this appears.</p>
            </Fragment>
          </li>
          <li class="deck-card">
            <Fragment step={2}>
              <h3>Then</h3>
              <p>A second press reveals the next one.</p>
            </Fragment>
          </li>
          <li class="deck-card">
            <Fragment step={3}>
              <h3>Finally</h3>
              <p>The third press is the last, and the next press moves on.</p>
            </Fragment>
          </li>
        </ul>
      </Slide>

      <Slide label="Quote">
        <p class="deck-eyebrow">03 / On decks</p>
        <blockquote class="deck-title" style="text-transform:none;font-weight:600;">
          A slide should say one thing,
          <span class="deck-named">and then get out of the way.</span>
        </blockquote>
      </Slide>

      <Slide label="Closing">
        <p class="deck-eyebrow">Thanks</p>
        <h1 class="deck-title">
          Build the
          <span class="deck-named">deck</span>
        </h1>
        <p class="deck-body">
          Left and right arrows, space, swipe, Home and End. Press F for fullscreen, or print
          this page to get a PDF.
        </p>
      </Slide>
    </Deck>
  </div>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100vh;
    padding: 1.5rem;
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: #111114;
  }
  .demo__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: #e4e4e7;
  }
  .demo__brand {
    font-size: 0.8125rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #a1a1aa;
  }
  .demo__tools {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .demo__status {
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    color: #a1a1aa;
  }
  .demo__toggle {
    padding: 0.4rem 0.85rem;
    font-size: 0.8125rem;
    color: #e4e4e7;
    background: #27272a;
    border: 1px solid #3f3f46;
    border-radius: 999px;
    cursor: pointer;
  }
  .demo__toggle:hover {
    background: #3f3f46;
  }
  .demo__stage {
    display: grid;
    flex: 1;
    min-height: 34rem;
    overflow: hidden;
    border: 1px solid #27272a;
    border-radius: 1rem;
  }
  /* Left as the page on its own, the deck prints as one slide per page. */
  @media print {
    .demo {
      min-height: 0;
      gap: 0;
      padding: 0;
      background: #fff;
    }
    .demo__bar {
      display: none;
    }
    .demo__stage {
      display: block;
      min-height: 0;
      overflow: visible;
      border: 0;
      border-radius: 0;
    }
  }
</style>
