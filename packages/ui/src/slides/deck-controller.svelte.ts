import { untrack } from "svelte";
import { fitBox, gridBoxes, type Box, type Size } from "#src/slides/layout.js";
import {
  keyAction,
  nextPosition,
  ordinalOf,
  prevPosition,
  progressOf,
  settle,
  visibleIndexes,
  type KeyAction,
  type Position,
  type SlideState,
} from "#src/slides/navigation.js";
import { resolveLabels, type DeckLabels } from "#src/slides/labels.js";
import { DEFAULT_CANVAS, type Canvas, type SlideNotes } from "#src/slides/types.js";

/** What a mounted Slide tells the deck. Properties are getters over the slide's own props. */
export type SlideEntry = {
  readonly id: symbol;
  readonly steps: number;
  readonly hidden: boolean;
  readonly label?: string;
  readonly notes?: SlideNotes;
  readonly el?: HTMLElement | null;
};

/** `remote` is a move that came from another window or frame, so it must not be echoed back. */
export type Source = "local" | "remote";
export type Listener = (position: Position, source: Source) => void;

/** `index` and `step` are read and written through, so a Deck can back them with its bindable props. */
export type ControllerOptions = {
  index: number;
  step: number;
  loop?: boolean;
  fragments?: boolean;
  keyboard?: boolean;
  /** Whether the controls bar is showing, so the overview grid leaves room for it. */
  controls?: boolean;
  /** Whether a presenter view is configured, so the `p` key has something to open. */
  presenter?: boolean;
  canvas?: Canvas;
  labels?: Partial<DeckLabels>;
  /** Wraps a position change so a View Transition can snapshot around it. */
  transition?: (update: () => void) => void;
  /** How long the overview zoom plays, in ms. 0, or left out, swaps at once. */
  zoomMs?: () => number;
};

/**
 * The overview zoom while it plays. `index` is the slide the camera frames. `framed` puts that
 * slide in its full-size spot with the grid around it, and `running` lets the boxes transition.
 */
export type Zoom = { index: number; framed: boolean; running: boolean };

/** Height the controls bar takes at the bottom of the overview, in px. */
const CONTROLS_ROOM = 56;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Where `cell` lands when the camera moves `target` onto `fit`. Every box shares one scale and
 * shift, and a transform tween is linear in both, so the grid stays rigid while it zooms.
 */
function frame(cell: Box, target: Box, fit: Box): Box {
  const k = fit.scale / target.scale;
  return {
    x: fit.x + (cell.x - target.x) * k,
    y: fit.y + (cell.y - target.y) * k,
    scale: cell.scale * k,
  };
}

function isEditable(el: HTMLElement) {
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

const byDocumentOrder = (a: SlideEntry, b: SlideEntry) =>
  a.el && b.el
    ? a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1
    : 0;

export class DeckController {
  entries = $state.raw<SlideEntry[]>([]);
  view = $state<"slide" | "overview">("slide");
  /** The highlighted thumbnail in the overview, as an index among the visible slides. */
  cursor = $state(0);
  direction = $state<1 | -1>(1);
  zoom = $state<Zoom | null>(null);
  size = $state<Size>({ w: 0, h: 0 });

  readonly options!: ControllerOptions;
  #listeners = new Set<Listener>();
  #timer: ReturnType<typeof setTimeout> | undefined;
  #frame = 0;

  constructor(options: ControllerOptions) {
    this.options = options;
  }

  canvas = $derived(this.options.canvas ?? DEFAULT_CANVAS);
  labels = $derived(resolveLabels(this.options.labels));
  slides = $derived<SlideState[]>(
    this.entries.map((entry) => ({
      steps: this.options.fragments === false ? 0 : entry.steps,
      hidden: entry.hidden,
    })),
  );
  visible = $derived(visibleIndexes(this.slides));
  position = $derived(settle(this.slides, { index: this.options.index, step: this.options.step }));
  ordinal = $derived(ordinalOf(this.slides, this.position.index));
  progress = $derived(progressOf(this.slides, this.position));
  current = $derived(this.entries[this.position.index]);
  /** The slide after this one, for a presenter's preview. Null on the last. */
  upcoming = $derived(this.visible.find((i) => i > this.position.index) ?? null);
  overview = $derived(this.view === "overview");
  /** True when every fragment shows: in the overview, or on a deck that doesn't stage reveals. */
  revealAll = $derived(this.overview || this.options.fragments === false);
  atStart = $derived(prevPosition(this.slides, this.position, this.options.loop) === null);
  atEnd = $derived(nextPosition(this.slides, this.position, this.options.loop) === null);
  fit = $derived(fitBox(this.size, this.canvas));
  grid = $derived(
    gridBoxes(
      {
        w: this.size.w,
        h: Math.max(0, this.size.h - (this.options.controls === false ? 0 : CONTROLS_ROOM)),
      },
      this.canvas,
      this.visible.length,
    ),
  );

  /** Where slide `index` sits right now: centred to fit, or in its overview cell. */
  boxOf(index: number): Box | undefined {
    const zoom = this.zoom;
    const cell = this.grid.boxes[this.visible.indexOf(index)];
    if (zoom?.framed) {
      const target = this.grid.boxes[this.visible.indexOf(zoom.index)];
      return cell && target ? frame(cell, target, this.fit) : this.fit;
    }
    return this.overview || zoom ? cell : this.fit;
  }

  register(entry: SlideEntry): () => void {
    untrack(() => {
      this.entries = [...this.entries, entry].sort(byDocumentOrder);
    });
    return () =>
      untrack(() => {
        this.entries = this.entries.filter((candidate) => candidate !== entry);
        this.#write(this.position);
      });
  }

  listen(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  mount(): () => void {
    return () => this.#stopZoom();
  }

  /** Which deck hears a key is the page's call: Deck passes only keys from focus inside it. */
  get listening() {
    return this.options.keyboard !== false;
  }

  #write(position: Position) {
    this.options.index = position.index;
    this.options.step = position.step;
  }

  /** `animate: false` skips the slide transition, for a move the overview zoom already shows. */
  commit(target: Position | null, source: Source = "local", animate = true) {
    if (!target) return;
    const from = this.position;
    const to = settle(this.slides, target);
    if (to.index === from.index && to.step === from.step) return;
    this.direction = to.index >= from.index ? 1 : -1;
    const apply = () => this.#write(to);
    if (animate && to.index !== from.index && this.options.transition)
      this.options.transition(apply);
    else apply();
    for (const listener of this.#listeners) listener(to, source);
  }

  next() {
    this.commit(nextPosition(this.slides, this.position, this.options.loop));
  }

  prev() {
    this.commit(prevPosition(this.slides, this.position, this.options.loop));
  }

  go(index: number, step = 0, source: Source = "local") {
    this.commit({ index, step }, source);
  }

  /**
   * Opening zooms the camera out from the current slide to the whole grid. Closing zooms into
   * the current slide, so `select` moves there first.
   */
  toggleOverview(force?: boolean) {
    const open = force ?? !this.overview;
    if (open === this.overview) return;
    const index = this.position.index;
    if (open) this.cursor = Math.max(0, this.visible.indexOf(index));
    this.view = open ? "overview" : "slide";
    this.#stopZoom();
    const ms = this.options.zoomMs?.() ?? 0;
    if (ms <= 0 || !this.visible.includes(index)) return;

    /*
     * Each way paints its start state first and moves on a later frame. Moved in the same
     * flush, a style read in between (the overview handing focus back) commits the boxes
     * before the transition rule is on, and the zoom jumps to its end.
     */
    this.zoom = { index, framed: open, running: !open };
    this.#frame = requestAnimationFrame(() => {
      this.#frame = requestAnimationFrame(() => {
        this.zoom = { index, framed: !open, running: true };
        this.#timer = setTimeout(() => this.#stopZoom(), ms);
      });
    });
  }

  /** Leaves the overview on slide `index`. Picking the current slide keeps its step. */
  select(index: number) {
    const keep = index === this.position.index;
    this.commit({ index, step: keep ? this.position.step : 0 }, "local", false);
    this.toggleOverview(false);
  }

  #stopZoom() {
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
    this.zoom = null;
  }

  #moveCursor(to: number) {
    this.cursor = clamp(to, 0, this.visible.length - 1);
  }

  /**
   * Runs the deck's own keys. Returns the action it took, or null when the key wasn't its.
   * `fullscreen` and `presenter` are returned untouched, since they need the page.
   */
  handleKey(event: KeyboardEvent): KeyAction | null {
    if (event.defaultPrevented || !this.listening || event.altKey || event.ctrlKey || event.metaKey)
      return null;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target && isEditable(target)) return null;
    const action = keyAction(event.key, event.shiftKey);
    if (!action) return null;
    /* Space and Enter belong to a focused control, not to the deck. */
    if ((event.key === " " || event.key === "Enter") && target?.closest("button, a, summary"))
      return null;

    const handled = this.overview ? this.#overviewKey(action) : this.#slideKey(action);
    if (!handled) return null;
    event.preventDefault();
    return action;
  }

  #slideKey(action: KeyAction): boolean {
    switch (action) {
      case "next":
        this.next();
        return true;
      case "prev":
        this.prev();
        return true;
      case "first":
        this.go(this.visible[0] ?? 0);
        return true;
      case "last":
        this.go(this.visible[this.visible.length - 1] ?? 0);
        return true;
      case "overview":
        this.toggleOverview(true);
        return true;
      case "fullscreen":
        return true;
      case "presenter":
        return !!this.options.presenter;
      default:
        return false;
    }
  }

  #overviewKey(action: KeyAction): boolean {
    const cols = this.grid.cols;
    switch (action) {
      case "next":
        this.#moveCursor(this.cursor + 1);
        return true;
      case "prev":
        this.#moveCursor(this.cursor - 1);
        return true;
      case "down":
        this.#moveCursor(this.cursor + cols);
        return true;
      case "up":
        this.#moveCursor(this.cursor - cols);
        return true;
      case "first":
        this.#moveCursor(0);
        return true;
      case "last":
        this.#moveCursor(this.visible.length - 1);
        return true;
      case "select":
        this.select(this.visible[this.cursor] ?? this.position.index);
        return true;
      case "close":
      case "overview":
        this.toggleOverview(false);
        return true;
      case "fullscreen":
        return true;
      case "presenter":
        return !!this.options.presenter;
      default:
        return false;
    }
  }
}
