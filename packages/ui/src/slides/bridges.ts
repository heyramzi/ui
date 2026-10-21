/* The ways a deck talks to the outside: its URL, a parent frame, another window. Each returns a cleanup. */

import type { DeckController } from '#src/slides/deck-controller.svelte.js';
import { parseSlideParam } from '#src/slides/navigation.js';
import type { BridgeOptions, UrlSync } from '#src/slides/types.js';

/** Reads `?s=` once, then keeps it at the current slide. The write is a replace, so Back skips it. */
export function attachUrlSync(deck: DeckController, { param = 's', write }: UrlSync = {}): () => void {
  const initial = parseSlideParam(new URL(location.href).searchParams.get(param), deck.entries.length);
  if (initial !== null) deck.go(initial, 0, 'remote');
  return deck.listen(({ index }) => {
    const url = new URL(location.href);
    url.searchParams.set(param, String(index + 1));
    if (write) write(url);
    else history.replaceState(history.state, '', url);
  });
}

/**
 * Lets a host page drive a deck in an iframe. In: `{type:'deck:nav', delta}` and
 * `{type:'deck:go', index, step?}`. Out to the parent: `{type:'deck:change', index, step, total}`.
 */
export function attachBridge(deck: DeckController, { origin = location.origin }: BridgeOptions = {}): () => void {
  const onMessage = (event: MessageEvent) => {
    if (origin !== '*' && event.origin !== origin) return;
    const data = event.data;
    if (data?.type === 'deck:nav') {
      if (data.delta === -1) deck.prev();
      else if (data.delta === 1) deck.next();
    } else if (data?.type === 'deck:go' && Number.isInteger(data.index)) {
      deck.go(data.index, Number.isInteger(data.step) ? data.step : 0, 'remote');
    }
  };
  window.addEventListener('message', onMessage);
  const stop = deck.listen(({ index, step }, source) => {
    if (source === 'local' && window.parent !== window) {
      window.parent.postMessage({ type: 'deck:change', index, step, total: deck.visible.length }, origin);
    }
  });
  return () => {
    window.removeEventListener('message', onMessage);
    stop();
  };
}

type ChannelMessage = { type: 'state'; from: string; index: number; step: number } | { type: 'hello'; from: string };

/** Mirrors the deck across windows of one origin: the audience screen and a presenter view. */
export function attachChannel(deck: DeckController, name: string): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(`heyramzi-slides:${name}`);
  const self = crypto.randomUUID();
  const send = (message: ChannelMessage) => channel.postMessage(message);
  const state = ({ index, step } = deck.position): ChannelMessage => ({ type: 'state', from: self, index, step });

  channel.onmessage = ({ data }: MessageEvent<ChannelMessage>) => {
    if (data.from === self) return;
    if (data.type === 'hello') send(state());
    else deck.go(data.index, data.step, 'remote');
  };
  const stop = deck.listen((position, source) => {
    if (source === 'local') send(state(position));
  });
  send({ type: 'hello', from: self });
  return () => {
    stop();
    channel.close();
  };
}
