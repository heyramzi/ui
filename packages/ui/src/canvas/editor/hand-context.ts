// Whether the host page is drawn by hand. The host sets it once and the pen's
// text and shapes read it. With no host, they keep the app's look.

import { getContext, setContext } from "svelte";

const KEY = Symbol("canvas-hand-drawn");

/** Call during component init. `read` is a getter, so a toggle reaches mounted nodes. */
export function setHandDrawn(read: () => boolean): void {
  setContext(KEY, read);
}

export function useHandDrawn(): () => boolean {
  return getContext<(() => boolean) | undefined>(KEY) ?? (() => false);
}
