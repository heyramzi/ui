// The one reactive hook the renderer leans on: the editor is a plain object with
// onChange, so every derived value reads a single `version` number and nothing
// else subscribes.

import type { Editor } from "../core";

export type EditorTracker = {
  /** Bumps on every editor change. Read it inside a `$derived` to re-run. */
  readonly version: number;
};

/**
 * Track an editor. Call it once during component setup: the subscription is
 * registered in an effect and torn down with the component.
 */
export function trackEditor(editor: Editor): EditorTracker {
  let version = $state(0);
  $effect(() => {
    const off = editor.onChange(() => {
      version += 1;
    });
    return off;
  });
  return {
    get version() {
      return version;
    },
  };
}
