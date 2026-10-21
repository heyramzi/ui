// The text field a host hands the pen. A plain textarea keeps the canvas MIT-clean; a host that
// formats text provides a component, set once with the page skin.

import { getContext, setContext, type Component } from "svelte";

/** What the pen asks of a text field. A host component takes these and may take more. */
export type TextFieldProps = {
  value: string;
  placeholder?: string;
  ariaLabel?: string;
  class?: string;
  style?: string;
  /** `live` is true while typing, so a run of keystrokes folds into one undo step. */
  onCommit: (next: string, live: boolean) => void;
  /** A click on the text opens it. A pen text that opens on double-click turns this off. */
  clickToEdit?: boolean;
  /** The field closed: focus left it or Escape. */
  onExit?: () => void;
  /** Shown, never opened: a locked card. */
  readonly?: boolean;
};

/** What the pen calls on a field it holds a reference to. */
export type TextFieldHandle = {
  edit: (point?: { x: number; y: number }) => void | Promise<void>;
};

export type TextFieldComponent = Component<TextFieldProps, TextFieldHandle>;

/** For a host that mounts a pen node with `mount(..., { context })`, as a test does. */
export const TEXT_FIELD_KEY = Symbol("canvas-text-field");

/** Call during component init. */
export function setTextField(component: TextFieldComponent): void {
  setContext(TEXT_FIELD_KEY, component);
}

/** The host's field, or null: the pen then draws its own textarea. */
export function useTextField(): TextFieldComponent | null {
  return getContext<TextFieldComponent | undefined>(TEXT_FIELD_KEY) ?? null;
}
