import type { A11yNote } from "#lib/a11y-notes.js";

export const inputNotes: Record<string, A11yNote> = {
  // Components: Inputs
  field: {
    notes: [
      "Field is a group. A FieldSet with a FieldLegend names a whole set of controls.",
      'FieldError has role="alert", so it\'s read out when it appears.',
      "Field doesn't link the description or error to the control. Set aria-describedby yourself, or use SimpleField, which does.",
    ],
  },
  "simple-field": {
    notes: [
      "label is tied to the control through for, which has to match the control's id.",
      "The description or error is linked to the control with aria-describedby, so it's read after the label.",
      "An error also marks the control invalid and is read out as soon as it appears.",
    ],
  },
  "input-otp": {
    notes: [
      "It's one real input under the boxes, so typing, Backspace and paste work as in any text field.",
      "It asks for a one-time code, so a phone can fill it from a text message.",
      'Give the root an aria-label, like "Verification code". The boxes are drawn, not read.',
    ],
  },
  checkbox: {
    keys: [{ keys: ["Space"], does: "Checks or unchecks the box." }],
    notes: [
      "Enter does nothing, so it can't submit the form by accident.",
      "An indeterminate box reports mixed. Space from there checks it.",
    ],
  },
  "radio-group": {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves focus to the checked item, or the first one. The group is one stop.",
      },
      { keys: ["ArrowDown"], does: "Moves focus to the next item and checks it." },
      { keys: ["ArrowUp"], does: "Moves focus to the previous item and checks it." },
      { keys: ["Space"], does: "Checks the focused item." },
    ],
    notes: [
      'With orientation="horizontal", ArrowRight and ArrowLeft move instead.',
      "Until something is checked, the arrow keys only move focus.",
      "Focus loops from the last item back to the first unless loop is false.",
    ],
  },
  switch: {
    keys: [{ keys: ["Space", "Enter"], does: "Turns the switch on or off." }],
    notes: ["It's a switch that reports on or off. Tie a Label to it so it has a name."],
  },
  slider: {
    keys: [
      { keys: ["ArrowRight", "ArrowUp"], does: "Raises the value by one step." },
      { keys: ["ArrowLeft", "ArrowDown"], does: "Lowers the value by one step." },
      { keys: ["Home"], does: "Sets the minimum." },
      { keys: ["End"], does: "Sets the maximum." },
      { keys: ["Cmd+ArrowRight", "Cmd+ArrowUp"], does: "Jumps to the maximum." },
      { keys: ["Cmd+ArrowLeft", "Cmd+ArrowDown"], does: "Jumps to the minimum." },
    ],
    notes: [
      "The thumb is the slider a screen reader hears. Name it with thumbLabel.",
      "A range slider has one thumb per value, and each is its own Tab stop.",
    ],
  },
  "star-rating-input": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the stars. They are one stop." },
      { keys: ["ArrowRight", "ArrowUp"], does: "Adds a star." },
      { keys: ["ArrowLeft", "ArrowDown"], does: "Takes a star off, down to zero." },
      { keys: ["Home"], does: "Clears the rating to zero." },
      { keys: ["End"], does: "Sets the top rating." },
      { keys: ["1", "2", "3", "4", "5"], does: "Sets that many stars." },
    ],
    notes: [
      "The stars are Bits UI's RatingGroup: a slider from 0 to max, the WAI-ARIA rating pattern.",
      'It\'s named by ariaLabel, or "Rating". Its value reads "3 of 5 stars", plus the step\'s label when labels is set, or "No rating".',
      "Clicking the first star again when it's the only one lit clears the rating.",
      'Read-only stars are an image named with the value, like "Rating, 3 of 5 stars".',
      "With reduced motion on, the pop on a pick doesn't play.",
    ],
  },
  "tags-input": {
    keys: [
      { keys: ["Space", "Enter"], does: "On the field, starts editing." },
      { keys: ["ArrowDown", "ArrowUp"], does: "Moves through the suggestions. The list loops." },
      {
        keys: ["Enter"],
        does: "Adds the highlighted suggestion. With the box empty, stops editing.",
      },
      { keys: [","], does: "Adds the highlighted suggestion." },
      {
        keys: ["Tab"],
        does: "With text typed, adds the highlighted suggestion and stays in the box.",
      },
      { keys: ["Backspace"], does: "With the box empty, removes the last tag." },
      {
        keys: ["ArrowLeft"],
        does: "At the start of the box, moves onto the last tag. On a tag, moves to the one before.",
      },
      { keys: ["ArrowRight"], does: "On a tag, moves to the next one, then back to the box." },
      {
        keys: ["Backspace", "Delete", "Enter", "Space"],
        does: "On a tag, removes it. Focus moves to the next tag or the box.",
      },
      {
        keys: ["Esc"],
        does: "On a tag, goes back to the box. In the box, clears what's typed, then stops editing and returns focus to the field.",
      },
    ],
    notes: [
      "The box is a combobox, and the suggestions are a listbox it points at.",
      "With free set the box is a plain text field with no suggestions: Enter, comma, Space or Tab adds what's typed.",
      "Pasting a comma-separated list adds each known label at once.",
      'A tag\'s remove button is named "Remove" plus the tag. It stays out of the Tab order; the arrows reach it.',
      'A polite status says "Added Make" or "Removed Make" once the change saves. labels.added and labels.removed change the words.',
      'At rest the field is named by label and its tags, like "Tools: Docusign, SharePoint".',
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
  calendar: {
    keys: [
      { keys: ["ArrowLeft"], does: "Moves to the previous day." },
      { keys: ["ArrowRight"], does: "Moves to the next day." },
      { keys: ["ArrowUp"], does: "Moves to the same day a week earlier." },
      { keys: ["ArrowDown"], does: "Moves to the same day a week later." },
      { keys: ["Space", "Enter"], does: "Picks the focused day." },
    ],
    notes: [
      "Moving past the first or last day turns the month.",
      "Weeks start on Monday unless you pass weekStartsOn.",
      "The previous and next month buttons are their own Tab stops.",
    ],
  },
};
