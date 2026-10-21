# @heyramzi/ui/slides

Slide decks for Svelte 5. Slides lay out on a fixed canvas (960 by 540 px by default) and the whole canvas scales to fit its container. Reveals, an overview grid, a presenter view, print and data-driven slide types are in the box. Theming is CSS variables only, so the core has no brand.

```svelte
<script>
  import { Deck, Slide, Fragment } from '@heyramzi/ui/slides';
</script>

<Deck title="Q3 review" urlSync presenter="/present">
  <Slide notes="Open on the number.">
    <h1 class="deck-display">Revenue is up</h1>
  </Slide>
  <Slide>
    <Fragment step={1}>First point</Fragment>
    <Fragment step={2}>Second point</Fragment>
  </Slide>
</Deck>
```

Keys: arrows, Space (Shift+Space back), PageUp/PageDown, Home/End, `O` overview, `F` fullscreen, `P` presenter. Swipe works on touch. With several decks on a page, only the sole, focused or hovered deck answers keys.

## Deck props

| Prop | Default | |
| --- | --- | --- |
| `index`, `step` | 0 | Bindable. `index` counts hidden slides. |
| `canvas` | `{ w: 960, h: 540 }` | Design size in px. |
| `theme` | `'ink'` | `ink`, `paper` or `auto`. |
| `transition` | `'fade'` | `fade`, `slide`, `zoom`, `morph` (View Transitions, elements with a shared `data-morph` name) or `none`. |
| `keyboard` | `true` | Turn off when a slide holds a form. |
| `fragments` | `true` | Off shows every step at once. |
| `loop`, `progress`, `controls` | `false`, `true`, `true` | |
| `urlSync` | `false` | Keeps `?s=` (1 based). Pass `{ param, write }` to rename it or write the URL yourself, for example with SvelteKit's `replaceState`. |
| `bridge` | `false` | postMessage for iframes. In: `{type:'deck:nav', delta}`, `{type:'deck:go', index, step?}`. Out: `{type:'deck:change', index, step, total}`. Same origin unless `{ origin }`. |
| `sync` | | Name that mirrors the deck across windows over BroadcastChannel. |
| `presenter` | | URL of the presenter view. Adds a button and the `p` key. |
| `labels` | | Partial `DeckLabels` to translate every string. |
| `controller` | | Bindable `DeckController`: `next()`, `prev()`, `go(i, step)`, `toggleOverview()`, `position`, `ordinal`. |
| `id`, `title`, `locale`, `onchange`, `class`, `style` | | |

`Slide`: `notes` (string or snippet), `hidden`, `label`, `align` (`center`, `start`, `bare`). `Fragment`: `step`, `reveal` (`rise`, `fade`, `scale`), `as`. Fragments that share a step stagger. Authored type classes: `deck-display`, `deck-title`, `deck-heading`, `deck-lead`, `deck-body`, `deck-caption`, `deck-label`, `deck-accent`.

## Theming

Set variables on `.deck`: `--deck-bg`, `--deck-fg`, `--deck-accent`, `--deck-on-accent`, `--deck-font`, `--deck-font-display`, `--deck-pad`, `--deck-text-*` (design px) and the timing tokens `--deck-t-slide`, `--deck-t-morph`, `--deck-stagger`, `--deck-ease`. They default to the `@heyramzi/ui` motion tokens when present. Motion is transform and opacity only and stops under `prefers-reduced-motion`.

## Data-driven decks

```ts
import { defineRegistry, defineSlideType } from '@heyramzi/ui/slides/model';

const cover = defineSlideType({ type: 'cover', label: 'Cover', layout: CoverLayout });
const registry = defineRegistry([cover]);
```

```svelte
<Deck {...deck} {registry} />
```

`deck` is a `DeckData` (`id`, `title`, `locale?`, `canvas`, `theme?`, `slides: SlideInstance[]`). A slide is `{ id, type, content, notes?, hidden? }`. Validate content where it comes in, with the schema you already use.

## Presenter view

Mount it on its own route and give the audience deck the same `sync` name:

```svelte
<Presenter sync="q3" title="Q3 review"><Slides /></Presenter>
```

It shows the current slide, the next one, notes and a timer, in step with the audience window. Pass the same children or `slides` and `registry` as the audience deck.

## Print

Print gives one canvas per page, sized by an injected `@page` rule (960 by 540 px is 10 by 5.625 in), with every fragment shown and the chrome hidden. Hidden slides are skipped.

## Export

`@heyramzi/ui/slides/export` is Node only. It drives the Playwright browser and pages you pass in, and the `ffmpeg` on your path, so the package depends on neither.

- `launchChromium(chromium)`: headless Chromium, falling back to installed Chrome.
- `capturePage` and `captureEach`: PNGs of a page or each slide at a canvas size and device scale.
- `printUrl`, `printHtml` and `printPage`: a PDF at the page size, after fonts, images and an optional `ready` selector settle.
- `imagesToPdf`: one page per PNG, for colour that has to match the PNGs exactly.
- `renderLoop` and `encodeFrames`: an mp4 from captured frames.

## Accessibility

The deck is a labelled region, inactive slides are `inert`, the progress bar has `role="progressbar"`, and a live region announces "Slide 3 of 12".
