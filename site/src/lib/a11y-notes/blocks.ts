import type { A11yNote } from "#lib/a11y-notes.js";

export const blockNotes: Record<string, A11yNote> = {
  // Blocks: Editor
  "inline-editor": {
    keys: [
      { keys: ["Cmd+B"], does: "Bold." },
      { keys: ["Cmd+I"], does: "Italic." },
      { keys: ["Cmd+Shift+X", "Cmd+Shift+S"], does: "Strikethrough." },
      { keys: ["Cmd+E"], does: "Inline code." },
      { keys: ["Cmd+Shift+8"], does: "Bullet list." },
      { keys: ["Cmd+Shift+7"], does: "Numbered list." },
      { keys: ["Cmd+K"], does: "Asks the host for a link, through onLink." },
      { keys: ["Cmd+Z"], does: "Undo." },
      { keys: ["Cmd+Shift+Z", "Cmd+Y"], does: "Redo." },
      { keys: ["Enter"], does: "In a list, starts a new item." },
      {
        keys: ["Shift+Tab"],
        does: "In a list, lifts the item out. From a plain paragraph, leaves the field.",
      },
      { keys: ["Tab"], does: "Does nothing, so lists stay flat." },
      { keys: ["Esc"], does: "Calls onExit. The host decides where focus goes." },
    ],
    notes: [
      "Cmd is Ctrl on Windows and Linux.",
      'The field is a multi-line text box named by label, "Text editor" by default.',
      "With inline set, the list keys are off and only the marks work.",
      "The page's shortcuts don't hear what you type in the field, except Cmd+S.",
      'Typing [ ] and a space starts a checklist, and every box is a real checkbox named by its line, like "Task item checkbox for Buy milk".',
    ],
  },
  "rich-editor": {
    keys: [
      { keys: ["/"], does: "At the start of a line or after a space, opens the command menu." },
      { keys: ["ArrowDown", "ArrowUp"], does: "In the command menu, moves the highlight." },
      { keys: ["Enter"], does: "In the command menu, runs the highlighted command." },
      {
        keys: ["Esc"],
        does: "Closes the command menu, or the image toolbar with focus back in the text.",
      },
      {
        keys: ["ArrowRight", "ArrowLeft"],
        does: "In a toolbar, moves to the next or previous button, wrapping at the ends.",
      },
      { keys: ["Home", "End"], does: "In a toolbar, moves to the first or last button." },
      { keys: ["Cmd+B"], does: "Bold." },
      { keys: ["Cmd+I"], does: "Italic." },
      { keys: ["Cmd+U"], does: "Underline." },
      { keys: ["Cmd+Shift+S"], does: "Strikethrough." },
      { keys: ["Cmd+E"], does: "Inline code." },
      {
        keys: ["Cmd+Alt+1", "Cmd+Alt+2", "Cmd+Alt+3", "Cmd+Alt+4"],
        does: "Heading 1 to 4. The notes preset stops at 3.",
      },
      { keys: ["Cmd+Alt+0"], does: "Back to a paragraph." },
      { keys: ["Cmd+Shift+B"], does: "Quote." },
      { keys: ["Cmd+Shift+8"], does: "Bullet list." },
      { keys: ["Cmd+Shift+7"], does: "Numbered list." },
      { keys: ["Cmd+Shift+9"], does: "Checklist, in the full preset." },
      { keys: ["Cmd+Alt+C"], does: "Code block." },
      { keys: ["Shift+Enter", "Cmd+Enter"], does: "Line break inside the paragraph." },
      {
        keys: ["Cmd+K"],
        does: "Opens the link field, or removes the link under the cursor. Not in the page variant, which has no toolbar.",
      },
      {
        keys: ["Alt+Shift+ArrowUp", "Alt+Shift+ArrowDown"],
        does: "Moves the block holding the cursor up or down, the same block the drag handle moves. A whole list or table moves as one.",
      },
      {
        keys: ["Tab", "Shift+Tab"],
        does: "Indents or outdents a list item. In a table, moves to the next or previous cell, and Tab in the last cell adds a row.",
      },
      { keys: ["Cmd+Z"], does: "Undo." },
      { keys: ["Cmd+Shift+Z", "Cmd+Y"], does: "Redo." },
    ],
    notes: [
      "Cmd is Ctrl on Windows and Linux.",
      'The writing area is named by label, "Text editor" by default.',
      "In the link field, Enter applies the link and Esc cancels and returns focus to the text.",
      "The toolbar is one Tab stop named Formatting, and Shift+Tab from the text comes back to the button you left. Tab leaves it.",
      "H1 to H3 are one pick: radio buttons, the current heading checked. The other buttons report pressed.",
      "Each toolbar button shows its name and shortcut in a tooltip on hover or keyboard focus.",
      "Focus stays in the text while the command menu is open. The text points at the highlighted command, so a screen reader reads it as it moves.",
      "The link field's Cancel button is named Cancel link.",
      "Arrowing onto an image selects it and opens its toolbar while focus stays in the text. Tab moves into the toolbar, one Tab stop named Image: the arrows move between Align left, Align center, Align right and Delete image, and Esc closes it and returns to the text.",
      "Checklist boxes are named by their line.",
      "The Image and YouTube commands open a dialog that asks for the link, with focus in the field. Enter inserts and Esc cancels, and either way focus goes back to the text.",
      "A link the dialog can't use shows its error under the field, read out as an alert, and focus stays in the field.",
    ],
  },

  // Blocks: Layouts
  "section-card": {
    notes: [
      "The card's title is an h3. SectionHeader's title is an h2 unless you set level.",
      "FieldRow ties its label to the control through for, and links the description or error to it.",
      "An error marks the control invalid and is read out as an alert.",
    ],
  },
  "doc-page": {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves through the contents list and the page's own links and controls.",
      },
      { keys: ["Space", "Enter"], does: "On a contents item, scrolls to that heading." },
      {
        keys: ["Esc"],
        does: "Closes the contents menu on a narrow page and returns focus to its button.",
      },
    ],
    notes: [
      "The title is an h1. The contents is a nav named by contentsLabel, and the current heading reports itself as current.",
      "On a narrow pane the contents is a button that opens a menu, with focus on the current heading.",
      "Picking a heading scrolls to it, at once under reduced motion, but focus stays in the contents list.",
      "Picking from the narrow menu, or a click outside it, closes it and returns focus to its button.",
      "With reduced motion on, the rail marker and progress line don't animate.",
    ],
  },
  "list-page": {
    keys: [
      { keys: ["Tab"], does: "Moves through the toolbar, the rows, then the open record." },
      { keys: ["Space", "Enter"], does: "On a row, opens its record." },
      {
        keys: ["ArrowDown", "ArrowUp"],
        does: "In a filter menu, moves through its options. Space or Enter checks one and the menu stays open.",
      },
      { keys: ["Esc"], does: "Closes a filter menu and returns focus to its button." },
      {
        keys: ["ArrowDown", "ArrowUp", "Home", "End"],
        does: "In a GroupedList, moves between the group headers. Space or Enter folds or unfolds one.",
      },
    ],
    notes: [
      "Rows are buttons, and the open one reports itself as current.",
      "A filter button opens a menu, and each option reports checked.",
      "A GroupedList header reports open or closed and points at the rows it folds.",
      "The filter tabs are a named group of radio buttons. Arrows move between them, and the picked one reports checked.",
      "The search field has only its placeholder for a name.",
      "Under 1024px wide, the list and the record take turns. Picking a row moves focus into the record, and the back button returns it to that row.",
      "With reduced motion on, the list-to-record slide doesn't play.",
    ],
  },
  dashboard: {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves through the period filter, linked tiles, column sort buttons, row links, and any head, cell or grade that has a hint.",
      },
      { keys: ["Space", "Enter"], does: "On a column's sort button, sorts by it." },
      { keys: ["Esc"], does: "On a head, cell or grade with a hint, hides its tooltip." },
    ],
    notes: [
      "The period filter is a named group of radio buttons, one Tab stop that the arrows move through, or links when href is set.",
      "The table has real column headers. A sortable head holds a button and reports its sort order.",
      "A head's hint, a cell's title and a grade's hint show as a tooltip on hover or focus, and the focused one describes itself with it.",
      'A tile\'s change reads with its direction, like "up 8%".',
      "The charts here are named and summarised, hold a hidden table of their values, and the arrow keys step the tooltip.",
      "With reduced motion on, the numbers show their final value with no count.",
    ],
  },

  // Blocks: Slides
  "slide-deck": {
    keys: [
      { keys: ["ArrowRight", "PageDown", "Space"], does: "Next step or slide." },
      { keys: ["ArrowLeft", "PageUp", "Shift+Space"], does: "Previous step or slide." },
      { keys: ["Home"], does: "First slide." },
      { keys: ["End"], does: "Last slide." },
      { keys: ["O"], does: "Opens or closes the slide overview." },
      { keys: ["ArrowUp", "ArrowDown"], does: "In the overview, moves a row up or down." },
      { keys: ["Enter"], does: "In the overview, opens the focused slide." },
      { keys: ["Esc"], does: "Closes the overview and returns focus to the deck." },
      { keys: ["F"], does: "Turns fullscreen on or off." },
      { keys: ["P"], does: "Opens the presenter view, when the deck has one." },
    ],
    notes: [
      'The deck is a region named by its title. A live region says "Slide 3 of 12" when the slide changes.',
      "A screen reader gets only the current slide. The others, and steps not shown yet, are hidden and can't take focus.",
      "A step that appears isn't announced.",
      "The keys work while focus is inside the deck, or while it's fullscreen. Elsewhere Space and PageDown scroll the page as usual. Click the deck or Tab to it first.",
      "The presenter window puts focus on its deck when it opens.",
      "Space and Enter on a focused button or link stay with that control.",
      "The controls are a toolbar and one Tab stop. While one has focus, ArrowLeft, ArrowRight, Home and End move along the toolbar instead of the deck.",
      "With reduced motion on, the morph between slides is skipped.",
    ],
  },

  // Blocks: Canvas
  canvas: {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves between the tool rail, the style bar and the nodes. Each bar is one stop.",
      },
      {
        keys: ["ArrowUp", "ArrowDown", "Home", "End"],
        does: "On the tool rail, moves between the tools. ArrowLeft and ArrowRight do it on the style bar.",
      },
      {
        keys: ["Space", "Enter"],
        does: "On a bar, picks the focused tool, colour or size. On a node, selects it.",
      },
      { keys: ["Esc"], does: "Deselects the focused node, or cancels a stroke being drawn." },
      {
        keys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
        does: "Moves the selected nodes 5px. Hold Shift for 20px.",
      },
      { keys: ["Backspace", "Delete"], does: "Deletes the selected nodes." },
      {
        keys: ["V", "H", "L", "P", "M", "E", "T", "R", "O", "D", "F"],
        does: "Picks the tool its tooltip names, while focus is on the canvas and not in a text field.",
      },
    ],
    notes: [
      "A live region announces every arrow move.",
      "Tools, colours and sizes are named radios that report checked, and each tool's tooltip and aria-keyshortcuts give its letter. resolveToolKey turns a key press into the tool, so a host binds the letters in one line.",
      'A node is named by its words: "Draw on me", "Rectangle: Idea", or "Pen stroke" for a drawing. The name follows edits.',
      "Drawing, placing a shape or text, connecting nodes and resizing a shape are still pointer only.",
      "Enter doesn't open a node's text yet. The host owns that key and calls requestStartEdit.",
      "A node's text field keeps the keys you type in it, and Esc leaves it.",
      "With reduced motion on, the toolbar doesn't animate.",
    ],
  },
};
