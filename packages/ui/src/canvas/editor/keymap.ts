// The canvas keyboard map, as a resolver rather than a switch in the editor.
// Mirrors resolveMindmapKeyAction in mindmap-keyboard.ts, which the mode
// controllers already read.

export type EditorKeyAction =
  | "undo"
  | "redo"
  | "copy"
  | "paste"
  | "select-all"
  | "save"
  | "delete"
  | "duplicate"
  | "group"
  | "ungroup"
  | "zoom-in"
  | "zoom-out"
  | "zoom-100"
  | "zoom-fit"
  | "zoom-selection"
  | "bring-forward"
  | "send-backward"
  | "bring-to-front"
  | "send-to-back"
  | "lock"
  | "copy-as-png"
  | "present";

/** True while the event's target owns its own text editing. */
export function isEditingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  const tag = el?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable === true;
}

/** The action a key means on the canvas, or null when the canvas does not own it. */
export function resolveEditorKeyAction(
  event: KeyboardEvent,
  hasSelection: boolean,
): EditorKeyAction | null {
  const key = event.key.toLowerCase();
  const mod = event.metaKey || event.ctrlKey;
  const editing = isEditingTarget(event.target);
  if (mod) return modAction(key, event.shiftKey, editing);
  if (event.key === "Delete" || event.key === "Backspace") {
    return hasSelection && !editing ? "delete" : null;
  }
  return editing || event.altKey ? null : plainAction(event);
}

/** Shift with a digit zooms. Read by code, so a layout that moves the digits still works. */
const SHIFT_ZOOM = new Map<string, EditorKeyAction>([
  ["Digit0", "zoom-100"],
  ["Digit1", "zoom-fit"],
  ["Digit2", "zoom-selection"],
]);

const PLAIN_KEYS = new Map<string, EditorKeyAction>([
  ["]", "bring-forward"],
  ["[", "send-backward"],
  ["+", "zoom-in"],
  ["=", "zoom-in"],
  ["-", "zoom-out"],
  ["_", "zoom-out"],
]);

/** Zoom keys with no chord: + and -, and Shift with 0, 1 or 2. */
function plainAction(event: KeyboardEvent): EditorKeyAction | null {
  const zoom = event.shiftKey ? SHIFT_ZOOM.get(event.code) : undefined;
  return zoom ?? PLAIN_KEYS.get(event.key) ?? null;
}

/** The move an arrow key asks for: 1px, or 10px with Shift. Null for anything else, or while a field owns the keys. */
export function resolveNudge(event: KeyboardEvent): { dx: number; dy: number } | null {
  if (event.metaKey || event.ctrlKey || event.altKey || isEditingTarget(event.target)) return null;
  const step = event.shiftKey ? 10 : 1;
  switch (event.key) {
    case "ArrowLeft":
      return { dx: -step, dy: 0 };
    case "ArrowRight":
      return { dx: step, dy: 0 };
    case "ArrowUp":
      return { dx: 0, dy: -step };
    case "ArrowDown":
      return { dx: 0, dy: step };
    default:
      return null;
  }
}

/** What a chord means without Shift, then with it. Null where that variant is not ours. */
type Chord = readonly [plain: EditorKeyAction | null, shifted: EditorKeyAction | null];

const both = (action: EditorKeyAction): Chord => [action, action];

const CHORDS = new Map<string, Chord>([
  ["c", ["copy", "copy-as-png"]],
  ["v", both("paste")],
  ["a", both("select-all")],
  ["d", ["duplicate", null]],
  ["g", ["group", "ungroup"]],
  ["l", [null, "lock"]],
  ["]", both("bring-to-front")],
  ["[", both("send-to-back")],
  ["enter", both("present")],
  ["=", both("zoom-in")],
  ["+", both("zoom-in")],
  ["-", both("zoom-out")],
  ["_", both("zoom-out")],
]);

/** The chord half of the map. `editing` is true while a field owns the keys. */
function modAction(key: string, shift: boolean, editing: boolean): EditorKeyAction | null {
  if (key === "z") return shift ? "redo" : "undo";
  if (key === "y") return "redo";
  // Save works whatever has focus, and whatever the autosave preference is.
  if (key === "s" && !shift) return "save";
  // Cut, copy, paste and select-all belong to the focused field while one is
  // being typed in; the canvas only claims them otherwise.
  if (editing) return null;
  return CHORDS.get(key)?.[shift ? 1 : 0] ?? null;
}

/** Tags and roles that activate on Space themselves, so the canvas must not steal it. */
const SPACE_OWNING_TAGS = new Set(["BUTTON", "A", "SUMMARY", "SELECT", "OPTION"]);
const SPACE_OWNING_ROLES = new Set([
  "button",
  "checkbox",
  "switch",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "tab",
]);

/** Space means hand tool over the canvas, never in a field or on a Space-activating control. Reads code, so remapped layouts still pan. */
export function isPanActivationKey(event: KeyboardEvent): boolean {
  if (event.code !== "Space" && event.key !== " ") return false;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (isEditingTarget(event.target)) return false;
  return !ownsSpace(event.target as HTMLElement | null);
}

/** A control that already does something on Space: a button, a checkbox, a tab. */
function ownsSpace(el: HTMLElement | null): boolean {
  if (el?.tagName && SPACE_OWNING_TAGS.has(el.tagName)) return true;
  const role = el?.getAttribute?.("role");
  return Boolean(role && SPACE_OWNING_ROLES.has(role));
}
