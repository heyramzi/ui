export { default as Deck } from '#src/Deck.svelte';
export { default as Slide } from '#src/Slide.svelte';
export { default as Fragment } from '#src/Fragment.svelte';
export { default as Presenter } from '#src/Presenter.svelte';
export { DeckController } from '#src/deck-controller.svelte.js';
export type { SlideEntry, Source } from '#src/deck-controller.svelte.js';
export { defaultLabels } from '#src/labels.js';
export type { DeckLabels } from '#src/labels.js';
export type { Position } from '#src/navigation.js';
export type {
  BridgeOptions,
  Canvas,
  DeckTheme,
  DeckTransition,
  SlideAlign,
  SlideNotes,
  UrlSync,
} from '#src/types.js';
export { DEFAULT_CANVAS } from '#src/types.js';
