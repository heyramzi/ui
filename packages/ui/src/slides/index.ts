export { default as Deck } from '#src/slides/Deck.svelte';
export { default as Slide } from '#src/slides/Slide.svelte';
export { default as Fragment } from '#src/slides/Fragment.svelte';
export { default as Presenter } from '#src/slides/Presenter.svelte';
export { DeckController } from '#src/slides/deck-controller.svelte.js';
export type { SlideEntry, Source } from '#src/slides/deck-controller.svelte.js';
export { defaultLabels } from '#src/slides/labels.js';
export type { DeckLabels } from '#src/slides/labels.js';
export type { Position } from '#src/slides/navigation.js';
export type {
  BridgeOptions,
  Canvas,
  DeckTheme,
  DeckTransition,
  SlideAlign,
  SlideNotes,
  UrlSync,
} from '#src/slides/types.js';
export { DEFAULT_CANVAS } from '#src/slides/types.js';
