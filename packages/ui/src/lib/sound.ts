/**
 * Interface sounds from cuelume, off until the person turns them on. Call `startSound()` once in
 * the root layout: it marks the kit's controls by their `data-slot` and binds them, so no
 * component carries a sound attribute of its own. Outcomes (saved, failed, ready) are `cue()`
 * calls in the app. The cue for each job follows https://cuelume.dev/agents.md, "Which cue?".
 */
import { bind, play, setEnabled, unlock, type PlayOptions, type SoundName } from "cuelume";

type Binding = "tap" | "select" | "toggle" | "open" | "close" | "navigate";

interface SlotCue {
  binding: Binding;
  /** Another cue than the binding's own, as `data-cuelume-tap="success"` plays `success`. */
  cue?: SoundName;
  subtle?: true;
}

/**
 * Which kit slots sound, and how. Text fields are left out on purpose: a keystroke sound in every
 * input is too much for tools people type in all day, so an app opts a field in with
 * `data-cuelume-type`.
 */
export const SLOT_CUES: Readonly<Record<string, SlotCue>> = {
  button: { binding: "tap" },
  "code-block-copy-button": { binding: "tap", cue: "success", subtle: true },
  switch: { binding: "toggle" },
  checkbox: { binding: "toggle" },
  toggle: { binding: "toggle" },
  "sidebar-trigger": { binding: "toggle", subtle: true },
  "dialog-trigger": { binding: "open" },
  "sheet-trigger": { binding: "open" },
  "alert-dialog-trigger": { binding: "open" },
  "popover-trigger": { binding: "open", subtle: true },
  "dropdown-menu-trigger": { binding: "open", subtle: true },
  "select-trigger": { binding: "open", subtle: true },
  "dialog-close": { binding: "close" },
  "sheet-close": { binding: "close" },
  "popover-close": { binding: "close", subtle: true },
  "select-item": { binding: "select" },
  "dropdown-menu-item": { binding: "select" },
  "dropdown-menu-checkbox-item": { binding: "select" },
  "dropdown-menu-radio-item": { binding: "select" },
  "context-menu-item": { binding: "select" },
  "command-item": { binding: "select" },
  "tabs-trigger": { binding: "select" },
  "radio-group-item": { binding: "select" },
  "toggle-group-item": { binding: "select" },
};

const BINDING_ATTRS = ["tap", "type", "select", "toggle", "open", "close", "navigate"].map(
  (b) => `data-cuelume-${b}`,
);
const STORAGE_KEY = "heyramzi:sound";

/** The saved setting, read on first use so a server render never touches storage. */
let wanted: boolean | undefined;
/** Open `silence()` holds. Any one of them mutes everything, whatever the setting says. */
let holds = 0;

function readSaved(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function audible(): boolean {
  wanted ??= typeof window === "undefined" ? false : readSaved();
  return wanted && holds === 0;
}

function apply(): void {
  setEnabled(audible());
}

/** Whether the person turned sound on. A `silence()` hold doesn't change it. */
export function soundOn(): boolean {
  audible();
  return wanted === true;
}

/**
 * Turns sound on or off and saves it. Call it from the click that flips the setting: turning on
 * unlocks audio inside that gesture, and the result says whether the browser lets it play.
 */
export function setSound(on: boolean): Promise<boolean> {
  wanted = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Private windows and blocked storage keep the choice for this page only.
  }
  apply();
  return on ? unlock() : Promise.resolve(false);
}

/**
 * Mutes every cue until the returned function runs, such as while the mic records, so no sound
 * lands in the take. Holds stack; each release counts once.
 */
export function silence(): () => void {
  holds++;
  apply();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds--;
    apply();
  };
}

/** Plays a cue for an outcome the app knows about, only while sound is on and nothing silences it. */
export function cue(name: SoundName, options?: PlayOptions): void {
  if (audible()) play(name, options);
}

function mark(el: Element): void {
  const slot = SLOT_CUES[el.getAttribute("data-slot") ?? ""];
  if (!slot || el.closest('[data-sound="off"]')) return;
  // A control that names its own cue keeps it.
  if (BINDING_ATTRS.some((attr) => el.hasAttribute(attr))) return;
  el.setAttribute(`data-cuelume-${slot.binding}`, slot.cue ?? "");
  if (slot.subtle && !el.hasAttribute("data-cuelume-emphasis")) {
    el.setAttribute("data-cuelume-emphasis", "subtle");
  }
}

/** Stamps the cuelume attribute on every kit control under `root`, `root` included. */
export function markSlots(root: ParentNode): void {
  if (root instanceof Element && root.hasAttribute("data-slot")) mark(root);
  for (const el of root.querySelectorAll("[data-slot]")) mark(el);
}

/**
 * Binds the kit's controls under `root` and keeps marking the ones that mount later. Safe on the
 * server, where it does nothing. Returns the function that stops it.
 */
export function startSound(root: ParentNode = globalThis.document): () => void {
  if (typeof window === "undefined" || !root) return () => {};
  apply();
  markSlots(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        if (record.target instanceof Element) mark(record.target);
        continue;
      }
      for (const node of record.addedNodes) {
        if (node instanceof Element) markSlots(node);
      }
    }
  });
  observer.observe(root as Node, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-slot"],
  });
  const unbind = bind(root);
  return () => {
    observer.disconnect();
    unbind();
  };
}
