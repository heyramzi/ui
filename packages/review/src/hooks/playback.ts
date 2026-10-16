/**
 * What the page asks of whatever plays the cut. Both players answer on the cut's own clock, so the
 * timeline, the notes and the word jumps never learn which one is behind it.
 */
export type Playback = {
  /** Puts the player's own `<video>` elements in the host. Returns the cleanup. */
  mount(host: HTMLElement): () => void;
  readonly time: number;
  readonly duration: number;
  readonly paused: boolean;
  /** A vertical cut, so the page can set the transcript beside it. */
  readonly portrait: boolean;
  /** The cut's width over its height. */
  readonly ratio: number;
  readonly ready: boolean;
  /** The first frame of what's on screen hasn't drawn yet. */
  readonly loading: boolean;
  /** True while the page says nothing can play. Locking pauses it, and nothing plays until it lifts. */
  readonly locked: boolean;
  /** The file whose audio the timeline draws, when the player has one. */
  readonly waveform: string | undefined;
  lock(on: boolean): void;
  seek(seconds: number): void;
  toggle(): void;
  pause(): void;
};
