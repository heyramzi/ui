import type { Snippet } from 'svelte';
import type { DeckController } from './deck-controller.svelte';
import type { DeckLabels } from './labels';
import type { SlideInstance, SlideRegistry } from './model';

export const DECK_KEY = Symbol('heyramzi.deck');
export const SLIDE_KEY = Symbol('heyramzi.slide');

/** `ink` is the dark default, `paper` a light surface, `auto` follows the system. */
export type DeckTheme = 'ink' | 'paper' | 'auto';

/** How a slide enters. `morph` uses the View Transitions API and falls back to a cut. */
export type DeckTransition = 'fade' | 'slide' | 'zoom' | 'morph' | 'none';

/** The design size in px. Slides lay out inside it and the whole canvas scales to fit. */
export type Canvas = { w: number; h: number };

export const DEFAULT_CANVAS: Canvas = { w: 960, h: 540 };

/** Speaker notes: plain text, or a snippet for rich markup. */
export type SlideNotes = string | Snippet;

/** How a Slide lays out its own content. `bare` leaves the whole canvas to the author. */
export type SlideAlign = 'center' | 'start' | 'bare';

/** Where a deck keeps `?s=`. `write` replaces the default `history.replaceState`, so SvelteKit apps can use its own. */
export type UrlSync = { param?: string; write?: (url: URL) => void };

/** `origin` guards incoming messages and defaults to this page's origin. `'*'` accepts any. */
export type BridgeOptions = { origin?: string };

/** What a Fragment sees of the slide around it. */
export type SlideContext = {
  shown: (step: number) => boolean;
  join: (step: number) => { order: number; leave: () => void };
};

/** Everything a Deck takes. */
export type DeckProps = {
  /** Active slide, zero based, hidden slides counted. Bindable. */
  index?: number;
  /** Active fragment step on the active slide. Bindable. */
  step?: number;
  /** The controller, for apps that drive the deck from outside. Bindable, read only. */
  controller?: DeckController;
  /** Names the deck's channel and region. A `DeckData` spreads straight in. */
  id?: string;
  /** Accessible name for the deck region. */
  title?: string;
  /** Language of the deck, set as `lang`. */
  locale?: string;
  /** Design size in px. Slides lay out inside it and it scales to fit. */
  canvas?: Canvas;
  /** Colour surface. `ink` (default), `paper` or `auto`. */
  theme?: DeckTheme;
  /** How slides enter: `fade` (default), `slide`, `zoom`, `morph` or `none`. */
  transition?: DeckTransition;
  /** Data mode: render these instances through `registry` instead of `children`. */
  slides?: SlideInstance[];
  registry?: SlideRegistry;
  /** Show the progress bar. */
  progress?: boolean;
  /** Show the previous, next, overview and fullscreen controls. */
  controls?: boolean;
  /** Wrap around at the ends. */
  loop?: boolean;
  /** Respond to keys. Turn off when a slide holds a form. */
  keyboard?: boolean;
  /** Stage fragments. Off shows everything at once, as a share view does. */
  fragments?: boolean;
  /** Keep `?s=` at the current slide. Pass an object to rename it or write the URL yourself. */
  urlSync?: boolean | UrlSync;
  /** Let a parent frame drive this deck over postMessage. */
  bridge?: boolean | BridgeOptions;
  /** Mirror this deck across windows of one origin under this name. */
  sync?: string;
  /** Where the presenter view lives. Adds a button and the `p` key. */
  presenter?: string;
  /** Translate or reword any string. */
  labels?: Partial<DeckLabels>;
  class?: string;
  style?: string;
  onchange?: (index: number, step: number) => void;
  children?: Snippet;
};

