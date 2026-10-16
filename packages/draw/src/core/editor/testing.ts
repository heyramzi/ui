// Scripted pointer input for tests. Tools are driven through the editor's
// dispatch with the same events the renderer sends, so a test needs no browser.

import type { Mods, PointerInfo, Vec } from "../types";
import type { Editor } from "./editor";

/** Per-step pointer defaults: a mouse click, no modifiers. */
export type PointerOptions = {
  pressure?: number;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  pointerType?: PointerInfo["pointerType"];
  /** 1 for a click, 2 for a double click. */
  clicks?: number;
};

export type ScriptStep =
  | ({ type: "pointer_down" } & PointerOptions & { at: Vec })
  | ({ type: "pointer_move" } & PointerOptions & { at: Vec })
  | ({ type: "pointer_up" } & PointerOptions & { at: Vec })
  | { type: "cancel" }
  | { type: "key_down"; key: string; mods?: Partial<Mods> }
  | { type: "key_up"; key: string };

function toVec(at: Vec | [number, number]): Vec {
  return Array.isArray(at) ? { x: at[0], y: at[1] } : at;
}

/** A pointer down at a screen point. */
export function down(at: Vec | [number, number], options: PointerOptions = {}): ScriptStep {
  return { type: "pointer_down", at: toVec(at), ...options };
}

/** A pointer move to a screen point. */
export function move(at: Vec | [number, number], options: PointerOptions = {}): ScriptStep {
  return { type: "pointer_move", at: toVec(at), ...options };
}

/** A pointer up at a screen point. */
export function up(at: Vec | [number, number], options: PointerOptions = {}): ScriptStep {
  return { type: "pointer_up", at: toVec(at), ...options };
}

function inputFrom(step: PointerOptions & { at: Vec }): Omit<PointerInfo, "point" | "targetId"> {
  return {
    screen: step.at,
    pressure: step.pressure ?? 0.5,
    shift: step.shift ?? false,
    alt: step.alt ?? false,
    meta: step.meta ?? false,
    pointerType: step.pointerType ?? "mouse",
    clicks: step.clicks ?? 1,
  };
}

/** Drive the editor through a list of pointer and key steps in order. */
export function scriptPointer(editor: Editor, steps: ScriptStep[]): void {
  for (const step of steps) {
    if (step.type === "cancel") {
      editor.dispatch({ type: "cancel" });
    } else if (step.type === "key_down") {
      editor.dispatch({
        type: "key_down",
        key: step.key,
        mods: { shift: false, alt: false, meta: false, ...step.mods },
      });
    } else if (step.type === "key_up") {
      editor.dispatch({ type: "key_up", key: step.key });
    } else {
      editor.dispatch({ type: step.type, input: inputFrom(step) });
    }
  }
}
