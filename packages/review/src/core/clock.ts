import type { LiveRange } from "#src/core/types.js";

/** A kept stretch of one take, with where it starts on the cut's clock and how long it plays there. */
export type Piece = { source: string; start: number; end: number; at: number; length: number };
export type Playlist = { pieces: Piece[]; duration: number };
/** A spot in the take: which piece, and the second inside the take. */
export type Spot = { index: number; source: string; seconds: number };

/** Two ranges that touch in one take play as one, so the player never jumps where there's no cut. */
const TOUCH = 1e-6;

/**
 * The kept ranges in order, on an output clock. With `fps`, each range rounds to whole frames like
 * `frameClock` in `@heyramzi/cut`, since raw seconds drift half a frame per cut.
 */
export function playlist(ranges: LiveRange[], fps?: number): Playlist {
  const pieces: Piece[] = [];
  let frames = 0;
  let seconds = 0;
  const clock = () => (fps ? frames / fps : seconds);
  for (const range of ranges) {
    if (!range.kept) continue;
    let end = range.end;
    let length = end - range.start;
    if (fps) {
      const count = Math.max(1, Math.round(end * fps) - Math.round(range.start * fps));
      length = count / fps;
      // The render holds a frame for a range too short to round to one, so the play list does too.
      if (end <= range.start) end = range.start + length;
    } else if (length <= 0) continue;
    const at = clock();
    const last = pieces.at(-1);
    if (last && last.source === range.source && Math.abs(last.end - range.start) < TOUCH) {
      last.end = end;
      last.length += length;
    } else pieces.push({ source: range.source, start: range.start, end, at, length });
    if (fps) frames += Math.round(length * fps);
    else seconds += length;
  }
  return { pieces, duration: clock() };
}

export const lengthOf = (piece: Piece): number => piece.length;

/** The cut's second to the take's second. Out of range lands on the first or the last moment. */
export function locate(list: Playlist, time: number): Spot | null {
  const last = list.pieces.length - 1;
  if (last < 0) return null;
  const t = Math.min(Math.max(time, 0), list.duration);
  const found = list.pieces.findIndex((piece) => t < piece.at + lengthOf(piece));
  const index = found === -1 ? last : found;
  const piece = list.pieces[index];
  if (!piece) return null;
  return {
    index,
    source: piece.source,
    seconds: piece.start + Math.min(t - piece.at, lengthOf(piece)),
  };
}

/** The take's second back to the cut's second, for the piece that's playing. */
export function outputAt(list: Playlist, index: number, seconds: number): number {
  const piece = list.pieces[index];
  if (!piece) return 0;
  return piece.at + Math.min(Math.max(seconds - piece.start, 0), lengthOf(piece));
}

/** Where a spot in a take sits in a new play list, or null when the edit cut it out. */
export function relocate(list: Playlist, source: string, seconds: number): Spot | null {
  const index = list.pieces.findIndex(
    (piece) => piece.source === source && seconds >= piece.start && seconds < piece.end,
  );
  return index === -1 ? null : { index, source, seconds };
}

/** The piece after this one: where playback jumps when this one ends. Null at the last range's end. */
export function nextJump(list: Playlist, index: number): Spot | null {
  const next = list.pieces[index + 1];
  return next ? { index: index + 1, source: next.source, seconds: next.start } : null;
}
