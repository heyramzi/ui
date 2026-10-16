export const DECK_KEY = Symbol('heyramzi.deck');
export const SLIDE_KEY = Symbol('heyramzi.slide');

/** How the deck drives its slides. Read through the context, never mutated. */
export type DeckApi = {
  index: () => number;
  step: () => number;
  total: () => number;
  isActive: (id: symbol) => boolean;
  registerSlide: (id: symbol, steps: () => number) => () => void;
  next: () => void;
  prev: () => void;
  go: (index: number) => void;
};

/** What a slide exposes to the fragments inside it. */
export type SlideApi = {
  isActive: () => boolean;
  activeStep: () => number;
  registerFragment: (step: number) => () => void;
};

/** `ink` is the dark default. `paper` is a warm light surface. `auto` follows the system. */
export type DeckTheme = 'ink' | 'paper' | 'auto';

/** How a slide enters. `fade` lifts it in, `slide` pushes it in, `none` cuts. */
export type DeckTransition = 'fade' | 'slide' | 'none';
