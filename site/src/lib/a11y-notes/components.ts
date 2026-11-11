import type { A11yNote } from "#lib/a11y-notes.js";

export const componentNotes: Record<string, A11yNote> = {
  // Components: Actions
  button: {
    keys: [{ keys: ["Space", "Enter"], does: "Presses the button." }],
    notes: [
      "With href it renders a link, so only Enter follows it.",
      "A disabled link leaves the Tab order and reports itself as disabled.",
      "An icon-only button has no text, so give it an aria-label.",
    ],
  },
  "copy-button": {
    keys: [{ keys: ["Space", "Enter"], does: "Copies the value." }],
    notes: [
      'The button\'s name comes from label, and it\'s "Copy" by default. Say what gets copied, like "Copy invite link".',
      "When the copy lands, a polite live region reads out copiedLabel.",
      'In a long list of these, announce="name" swaps the button\'s name to copiedLabel and skips the live region.',
      "Inside a clickable row or card, the press copies and doesn't open the row.",
    ],
  },
  "hold-to-confirm": {
    keys: [
      {
        keys: ["Space", "Enter"],
        does: "Hold to fill the button. It confirms when the fill reaches the end, 800 ms by default.",
      },
    ],
    notes: [
      "Letting go early, or focus leaving the button, cancels and empties the fill.",
      'Nothing announces the fill, so write the label as the instruction, like "Hold to delete".',
      "A screen reader's activate can't hold. Its first press arms the button and reads out \"Press again to confirm\". A second press within 5 seconds confirms.",
      "With reduced motion on, the fill tracks the hold with no easing or sheen.",
    ],
  },
  toggle: {
    keys: [{ keys: ["Space", "Enter"], does: "Turns the toggle on or off." }],
    notes: [
      "It's a button that reports pressed or not pressed.",
      'An icon-only toggle needs an aria-label that names the thing it turns on, like "Bold".',
    ],
  },
  "toggle-group": {
    keys: [
      { keys: ["Tab"], does: "Moves focus into the group, then out of it. The group is one stop." },
      { keys: ["ArrowRight"], does: "Moves focus to the next item." },
      { keys: ["ArrowLeft"], does: "Moves focus to the previous item." },
      { keys: ["Home"], does: "Moves focus to the first item." },
      { keys: ["End"], does: "Moves focus to the last item." },
      { keys: ["Space", "Enter"], does: "Turns the focused item on or off." },
    ],
    notes: [
      'With type="single" each item is a radio that reports checked. With type="multiple" each one reports pressed.',
      "Focus loops from the last item back to the first unless loop is false.",
      "Arrow keys only move focus. Nothing changes until you press Space or Enter.",
    ],
  },
  "theme-toggle": {
    keys: [{ keys: ["Space", "Enter"], does: "Switches the theme." }],
    notes: [
      'The name says what a press does, like "Switch to dark mode". With mode set, it reads "Theme: dark". label replaces both.',
      'The slide variant is a switch named "Dark mode" that reports on in dark and off in light. label replaces the name.',
      "With reduced motion on, the theme changes at once with no circular wipe, and the slide variant's thumb jumps.",
    ],
  },

  // Components: Feedback
  alert: {
    notes: [
      'Alert has role="alert", so a screen reader reads it out as soon as it appears.',
      "For a message that's on the page from the start, pass role=\"status\" or role={undefined} so it isn't read out of turn.",
    ],
  },
  progress: {
    notes: [
      "It's a progressbar that reports its value and max.",
      'Give it an aria-label that says what\'s loading, like "Upload". It has no name of its own.',
      "With reduced motion on, the fill jumps to each new value.",
    ],
  },
  spinner: {
    notes: [
      "It's a status named \"Loading\". Pass aria-label to say what's loading.",
      "With reduced motion on, it stops spinning.",
    ],
  },
  sonner: {
    keys: [
      { keys: ["Alt+T"], does: "Moves focus to the toasts and spreads the stack open." },
      { keys: ["Esc"], does: "With focus in the toasts, folds the stack back." },
    ],
    notes: [
      'Toasts sit in a polite live region named "Notifications", so each new one is read out.',
      "The type icons are hidden from screen readers. Say success or failure in the message itself.",
    ],
  },

  // Components: Data display
  avatar: {
    notes: [
      "Give the image an alt. When it fails to load, the fallback text is what a screen reader reads.",
    ],
  },
  flag: {
    notes: [
      "The flag is hidden from screen readers by default, because the country name sits beside it.",
      'Shown alone, pass label="Japan" and it becomes an image with that name.',
    ],
  },
  "language-flag": {
    notes: [
      'The flag\'s alt is the language code in capitals, like "FR".',
      "With showLabel on, the flag's alt is empty, so the code is read once, from the label.",
    ],
  },
  mark: {
    notes: [
      "The logo is decorative, with an empty alt. Put the name in text beside it, or name the control it sits in.",
      "When the image is missing or broken, the fallback initial is hidden from screen readers too.",
    ],
  },
  "tag-chip": {
    keys: [{ keys: ["Space", "Enter"], does: "On the remove button, removes the tag." }],
    notes: ['The remove button is named by removeLabel. Name the tag in it, like "Remove design".'],
  },
  "code-block": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the code, then to the copy button." },
      {
        keys: ["ArrowLeft", "ArrowRight"],
        does: "With the code focused, scrolls a long line sideways.",
      },
    ],
    notes: [
      "The code area takes focus so a keyboard can scroll it. Its focus ring is drawn inside the frame, so a clipping wrapper can't hide it.",
      'The copy button is the kit\'s copy button, named "Copy" and announcing "Copied".',
    ],
  },
  "table-view": {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves focus to the next sort button, row link, row button, checkbox or control in a cell.",
      },
      { keys: ["Enter"], does: "On a row link, opens the row." },
      {
        keys: ["Space", "Enter"],
        does: "On a row button, opens the row. On a sort button, sorts. On a group header, folds or unfolds the group.",
      },
      { keys: ["Space"], does: "On a row's checkbox, selects the row." },
      {
        keys: ["Shift+F10", "ContextMenu"],
        does: "On a row with a menu, or anything focused inside it, opens the row menu.",
      },
    ],
    notes: [
      "With rowHref, each row has one link named by its first column, or by rowLabel.",
      "With onRowClick and no rowHref, each row has one button with the same name, laid over the row.",
      'Row checkboxes are named "Select" plus the row\'s name. The header checkbox selects every row.',
      "A sortable column head holds a button, and the head reports ascending or descending.",
      "The table is named by label and reports busy while loading.",
      "A row menu also opens on right-click or a long press. A row with no link or button of its own takes focus itself, so the keys reach it.",
    ],
  },
  "data-table": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next column's sort button, then into the rows." },
      {
        keys: ["Space", "Enter"],
        does: "On a sort button, sorts by that column. Pressing again flips the order.",
      },
      {
        keys: ["Shift+F10", "ContextMenu"],
        does: "On a row in a RowContextMenu, or anything focused inside it, opens the row menu.",
      },
    ],
    notes: [
      "A sortable head holds a real button, and the head reports ascending or descending to a screen reader.",
      "The pager's previous and next buttons are named by previousLabel and nextLabel.",
      "The row menu also opens on right-click or a long press. Give the row a link or button so the keyboard can reach it.",
    ],
  },

  // Components: Layout
  accordion: {
    keys: [
      { keys: ["Space", "Enter"], does: "Opens or closes the focused section." },
      { keys: ["Tab"], does: "Moves focus to the next trigger, or into an open section." },
      { keys: ["ArrowDown"], does: "Moves focus to the next trigger." },
      { keys: ["ArrowUp"], does: "Moves focus to the previous trigger." },
      { keys: ["Home"], does: "Moves focus to the first trigger." },
      { keys: ["End"], does: "Moves focus to the last trigger." },
    ],
    notes: [
      "A trigger is a button that reports open or closed and points at its section.",
      "Focus loops from the last trigger back to the first unless loop is false.",
    ],
  },
  collapsible: {
    keys: [{ keys: ["Space", "Enter"], does: "Opens or closes the content." }],
    notes: ["The trigger is a button that reports open or closed and points at the content."],
  },
  "scroll-area": {
    notes: [
      "The content scrolls natively, so the wheel, touch and a focused element inside all scroll it.",
      "The viewport sets no tabindex. Chrome and Firefox still let Tab reach it when nothing inside can take focus, and then the arrow keys scroll it. Safari doesn't.",
    ],
  },
};
