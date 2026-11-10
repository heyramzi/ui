/** What the keyboard does on a component. Each string in `keys` is one alternative; "Shift+Tab" is a chord. */
export type A11yNote = { keys?: { keys: string[]; does: string }[]; notes?: string[] };

// Behaviour comes from Bits UI where the part wraps it: https://bits-ui.com/docs/components/<name>.
export const a11yNotes: Record<string, A11yNote> = {
  tabs: {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the active trigger, then into the open panel." },
      { keys: ["ArrowRight", "ArrowDown"], does: "Moves focus to the next trigger." },
      { keys: ["ArrowLeft", "ArrowUp"], does: "Moves focus to the previous trigger." },
      { keys: ["Home"], does: "Moves focus to the first trigger." },
      { keys: ["End"], does: "Moves focus to the last trigger." },
      {
        keys: ["Space", "Enter"],
        does: "Opens the focused tab when activationMode is manual.",
      },
    ],
    notes: [
      "The list is a tablist, each trigger a tab and each panel a tabpanel tied to its trigger.",
      "Focus loops from the last trigger back to the first unless loop is false.",
      "A tab opens as soon as it gets focus unless activationMode is manual.",
    ],
  },
  dialog: {
    keys: [
      { keys: ["Space", "Enter"], does: "Opens or closes the dialog from its trigger." },
      { keys: ["Tab"], does: "Moves focus to the next control inside the dialog." },
      { keys: ["Shift+Tab"], does: "Moves focus to the previous control inside the dialog." },
      { keys: ["Esc"], does: "Closes the dialog and returns focus to the trigger." },
    ],
    notes: [
      "Focus moves into the dialog when it opens and stays trapped there until it closes.",
      "Dialog.Title and Dialog.Description name and describe it for a screen reader.",
      "The page behind it stops scrolling while it's open.",
    ],
  },
  select: {
    keys: [
      {
        keys: ["Space", "Enter"],
        does: "On the trigger, opens the list on the selected item. On an item, picks it.",
      },
      {
        keys: ["ArrowDown"],
        does: "On the trigger, opens the list. On an item, moves to the next one.",
      },
      {
        keys: ["ArrowUp"],
        does: "On the trigger, opens the list. On an item, moves to the previous one.",
      },
      { keys: ["Esc"], does: "Closes the list and returns focus to the trigger." },
    ],
    notes: [
      "Typing a letter jumps to the first item whose label starts with it.",
      "Disabled items are skipped by the arrow keys.",
    ],
  },
};
