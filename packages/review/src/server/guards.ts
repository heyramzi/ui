/** Hand-written type guards: the body of a POST is `unknown` until it passes one of these. */
import { BEAT_STATES, NOTE_ACTS, isOneOf } from "#src/core/enums.js";
import type { Frame, NoteTarget, ReviewAction } from "#src/core/types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown, max = 4000): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const isId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 200;
const isUnit = (value: unknown): value is number =>
  typeof value === "number" && value >= 0 && value <= 1;
const isSeconds = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function isFrame(value: unknown): value is Frame {
  if (!isRecord(value) || !isUnit(value.x) || !isUnit(value.y)) return false;
  const hasW = value.w !== undefined;
  const hasH = value.h !== undefined;
  if (hasW !== hasH) return false;
  return !hasW || (isUnit(value.w) && isUnit(value.h));
}

const isAnchor = (value: unknown): boolean =>
  isRecord(value) && isId(value.source) && isSeconds(value.at);

export function isNoteTarget(value: unknown): value is NoteTarget {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case "video":
      return true;
    case "beat":
      return isId(value.beat);
    case "text":
      return (
        isId(value.from) &&
        isId(value.to) &&
        typeof value.quote === "string" &&
        value.quote.length <= 2000
      );
    case "time":
      return (
        isSeconds(value.at) &&
        (value.span === undefined || isSeconds(value.span)) &&
        (value.frame === undefined || isFrame(value.frame)) &&
        (value.anchor === undefined || isAnchor(value.anchor))
      );
    default:
      return false;
  }
}

export function isReviewAction(value: unknown): value is ReviewAction {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "decide":
      return (
        isId(value.beat) &&
        isOneOf(BEAT_STATES, value.state) &&
        (value.pick === undefined || isId(value.pick))
      );
    case "music":
      return isId(value.keep) || value.skip === true || value.more === true;
    case "note":
      return isNoteTarget(value.target) && isText(value.text);
    case "note.act":
      return isId(value.note) && isOneOf(NOTE_ACTS, value.act);
    case "note.reply":
      return isId(value.note) && isText(value.text);
    case "speech":
      return (
        isId(value.source) &&
        isSeconds(value.start) &&
        isSeconds(value.end) &&
        value.end > value.start &&
        isText(value.text, 2000)
      );
    case "refresh":
      return true;
    default:
      return false;
  }
}

/** The action a body holds, or null when it isn't one. */
export const parseAction = (body: unknown): ReviewAction | null =>
  isReviewAction(body) ? body : null;
