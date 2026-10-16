# @heyramzi/slides

A presentation library for Svelte 5. `<Deck>`, `<Slide>` and `<Fragment>` give you keyboard and swipe navigation, a progress bar, staged reveals, themes driven by CSS variables, and a print stylesheet that turns the deck into a PDF.

## Install

Copy `src/` into your project. The package has no dependencies beyond Svelte 5.

```bash
pnpm add @heyramzi/slides
```

## Usage

```svelte
<script>
  import { Deck, Slide, Fragment } from '@heyramzi/slides';
</script>

<Deck>
  <Slide label="Cover">
    <p class="deck-eyebrow">Svelte 5</p>
    <h1 class="deck-title">
      Presentations
      <span class="deck-named">in your app</span>
    </h1>
    <p class="deck-body">One line, then get out of the way.</p>
  </Slide>

  <Slide label="Steps">
    <h1 class="deck-title">Reveal on cue</h1>
    <Fragment step={1}><p class="deck-body">First.</p></Fragment>
    <Fragment step={2}><p class="deck-body">Then this.</p></Fragment>
  </Slide>
</Deck>
```

## Deck

`<Deck>` fills its container and sizes the slides to it. Give it a height.

| Prop         | Default | What it does                                                        |
| ------------ | ------- | ------------------------------------------------------------------- |
| `index`      | `0`     | Active slide. Bindable.                                              |
| `step`       | `0`     | Active fragment step. Bindable.                                      |
| `theme`      | `ink`   | `ink` (dark), `paper` (warm light) or `auto` (follows the system).   |
| `transition` | `fade`  | `fade`, `slide` or `none`.                                          |
| `progress`   | `true`  | Show the bottom progress bar.                                        |
| `controls`   | `true`  | Show previous, next, counter and fullscreen buttons.                 |
| `loop`       | `false` | Wrap around at the first and last slide.                            |
| `onchange`   | none    | Called with `(index, step)` after any move.                         |

Bind an instance and drive it from code:

```svelte
<Deck bind:this={decklet} bind:index bind:step>…</Deck>
<button onclick={() => decklet.next()}>Next</button>
```

The instance exposes `next()`, `prev()`, `go(index)` and `toggleFullscreen()`.

## Navigation

- Right arrow, Page Down, Space: next fragment, then next slide.
- Left arrow, Page Up: previous fragment, then previous slide. Going back reveals the fragments.
- Home, End: first and last slide.
- F: toggle fullscreen.
- Swipe left or right on a touch screen.

## Slide

`<Slide>` holds one slide. It is positioned absolutely and shown when active. `label` sets its accessible name. Inactive slides are `inert` and hidden from assistive tech.

Authored classes get the deck's type styles for free: `deck-eyebrow`, `deck-title`, `deck-named` (the italic accent line), `deck-body`, `deck-accent`, `deck-rule`, `deck-grid` and `deck-card`.

## Fragment

`<Fragment step={n}>` reveals its content once the deck reaches step `n` on that slide. The deck walks every fragment on a slide before it moves on, and the progress bar tracks along.

## Themes

Every colour, font, radius and spacing value is a CSS variable on `.deck`. Override any of them inline or from a parent:

```svelte
<Deck style="--deck-accent: #22d3ee; --deck-bg: #07131a; --deck-font-display: 'Georgia';">
  …
</Deck>
```

The useful variables are `--deck-bg`, `--deck-fg`, `--deck-muted`, `--deck-accent`, `--deck-accent-glow`, `--deck-line`, `--deck-font`, `--deck-font-display`, `--deck-pad`, `--deck-radius`, `--deck-grain` and `--deck-bloom`. The `ink` and `paper` themes are just preset values for these, so you can start from either and adjust a single token.

## Print to PDF

The deck ships a print stylesheet. Every slide becomes one full page in landscape, the bloom, grain, progress and controls are hidden, and the inactive slides are shown. Use the browser's Print and pick "Save as PDF". No server render step.

## Demo

`src/demo.svelte` is the page the site imports. It is a five slide deck with a theme toggle and a fragment slide.
