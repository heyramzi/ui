import { componentNotes } from "#lib/a11y-notes/components.js";
import { inputNotes } from "#lib/a11y-notes/inputs.js";
import { overlayNotes } from "#lib/a11y-notes/overlays.js";
import { effectNotes } from "#lib/a11y-notes/effects.js";
import { chartNotes } from "#lib/a11y-notes/charts.js";
import { chatNotes } from "#lib/a11y-notes/chat.js";
import { workNotes } from "#lib/a11y-notes/work.js";
import { blockNotes } from "#lib/a11y-notes/blocks.js";

/** What the keyboard does on a component. Each string in `keys` is one alternative; "Shift+Tab" is a chord. */
export type A11yNote = { keys?: { keys: string[]; does: string }[]; notes?: string[] };

// Behaviour comes from Bits UI where the part wraps it: https://bits-ui.com/docs/components/<name>.
// Other entries come from the kit's source. A gap note stays until the kit fixes it.
// Each file under a11y-notes/ holds one stretch of the nav, in nav order.
export const a11yNotes: Record<string, A11yNote> = {
  ...componentNotes,
  ...inputNotes,
  ...overlayNotes,
  ...effectNotes,
  ...chartNotes,
  ...chatNotes,
  ...workNotes,
  ...blockNotes,
};
