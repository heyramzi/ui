/* Data-driven decks: a deck is JSON, and a registry says how each slide type draws itself. */

import type { Component } from 'svelte';
import type { Canvas, DeckTheme } from '#src/slides/types.js';

export type SlideInstance<Content = unknown> = {
  id: string;
  type: string;
  content: Content;
  notes?: string;
  hidden?: boolean;
};

export type DeckData<Content = unknown> = {
  id: string;
  title: string;
  locale?: string;
  canvas: Canvas;
  theme?: DeckTheme;
  slides: SlideInstance<Content>[];
};

/** What a layout component receives. */
export type SlideLayoutProps<Content> = { content: Content; slide: SlideInstance<Content> };

export type SlideType<Content = any> = {
  type: string;
  /** Human name, used as the slide's accessible label and in editors. */
  label: string;
  layout: Component<SlideLayoutProps<Content>>;
};

export type SlideRegistry = Readonly<Record<string, SlideType>>;

/** Identity function that fixes `Content` from the layout. */
export const defineSlideType = <Content>(definition: SlideType<Content>): SlideType<Content> => definition;

/** Keys the types by their `type`. Two with the same name is a mistake worth failing on. */
export function defineRegistry(types: readonly SlideType[]): SlideRegistry {
  const registry: Record<string, SlideType> = {};
  for (const slide of types) {
    if (slide.type in registry) throw new Error(`Slide type "${slide.type}" is registered twice.`);
    registry[slide.type] = slide;
  }
  return registry;
}

