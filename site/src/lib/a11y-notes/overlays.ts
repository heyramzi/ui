import type { A11yNote } from "#lib/a11y-notes.js";

export const overlayNotes: Record<string, A11yNote> = {
  // Components: Overlays
  tooltip: {
    keys: [{ keys: ["Esc"], does: "Closes the tooltip." }],
    notes: [
      "It opens when the trigger gets keyboard focus, and after 400 ms of hover.",
      "Touch never opens it. Don't put anything only in a tooltip.",
      "The content can't take focus, so keep links and buttons out of it.",
    ],
  },
  "hover-card": {
    notes: [
      "It opens when the trigger gets keyboard focus and closes when focus leaves.",
      "The card is a preview for sighted pointer users. Bits UI takes everything inside it out of the Tab order, so the trigger link is the keyboard path. Keep anything a keyboard user needs out of the card.",
    ],
  },
  popover: {
    keys: [
      { keys: ["Space", "Enter"], does: "Opens or closes the popover from its trigger." },
      { keys: ["Tab"], does: "Moves focus to the next control inside the popover." },
      { keys: ["Shift+Tab"], does: "Moves focus to the previous control inside the popover." },
      { keys: ["Esc"], does: "Closes the popover and returns focus to the trigger." },
    ],
    notes: [
      "Focus moves into the popover when it opens and stays there until it closes.",
      "A click outside closes it too.",
    ],
  },
  "dropdown-menu": {
    keys: [
      { keys: ["Space", "Enter"], does: "On the trigger, opens the menu. On an item, runs it." },
      {
        keys: ["ArrowDown"],
        does: "On the trigger, opens the menu on its first item. In the menu, moves to the next item.",
      },
      { keys: ["ArrowUp"], does: "Moves to the previous item." },
      { keys: ["Home"], does: "Moves to the first item." },
      { keys: ["End"], does: "Moves to the last item." },
      { keys: ["ArrowRight"], does: "On a submenu trigger, opens the submenu." },
      { keys: ["ArrowLeft"], does: "In a submenu, closes it." },
      { keys: ["Esc"], does: "Closes the menu and returns focus to the trigger." },
    ],
    notes: [
      "Typing a letter jumps to the next item whose label starts with it.",
      "Checkbox and radio items report checked.",
      "Disabled items are skipped by the arrow keys.",
    ],
  },
  "context-menu": {
    keys: [
      { keys: ["ArrowDown", "ArrowUp"], does: "Moves between items once the menu is open." },
      { keys: ["Space", "Enter"], does: "Runs the focused item." },
      { keys: ["Esc"], does: "Closes the menu." },
    ],
    notes: [
      "It opens on right-click, or a 700 ms press on a touch screen.",
      "A keyboard can only open it with Shift+F10 or the Menu key, with focus inside the area. Most Mac keyboards have neither, so put the same actions somewhere else too.",
      "Once open, it works like a dropdown menu: Home, End, submenus and typing a letter all work.",
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
  "alert-dialog": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next button. Focus loops inside the dialog." },
      { keys: ["Shift+Tab"], does: "Moves focus to the previous button." },
      { keys: ["Esc"], does: "Closes the dialog, the same as Cancel." },
    ],
    notes: [
      "It's an alertdialog, so a screen reader reads its title and description when it opens.",
      "Focus lands on the dialog itself, not on the confirm button, so Enter can't confirm by accident.",
      "A click outside doesn't close it. The person has to pick an answer.",
    ],
  },
  sheet: {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next control inside the sheet." },
      { keys: ["Shift+Tab"], does: "Moves focus to the previous control inside the sheet." },
      { keys: ["Esc"], does: "Closes the sheet and returns focus to the trigger." },
    ],
    notes: [
      "A sheet is a dialog from the edge, so Tab can't leave it while it's open.",
      'The close button is named "Close".',
      "Sheet.Title and Sheet.Description name and describe it for a screen reader.",
    ],
  },
  command: {
    keys: [
      { keys: ["ArrowDown", "Ctrl+N", "Ctrl+J"], does: "Moves to the next item." },
      { keys: ["ArrowUp", "Ctrl+P", "Ctrl+K"], does: "Moves to the previous item." },
      { keys: ["Home"], does: "Moves to the first item." },
      { keys: ["End"], does: "Moves to the last item." },
      { keys: ["Enter"], does: "Runs the highlighted item." },
    ],
    notes: [
      "Focus stays in the search box while the arrow keys move a highlight through the list.",
      "Typing filters the list. Command.Empty shows when nothing matches.",
      "The highlight stops at the ends unless loop is set.",
      "Command.Dialog adds a hidden title, and works like a dialog: Esc closes it.",
    ],
  },
  picker: {
    keys: [
      { keys: ["Space", "Enter"], does: "On the trigger, opens the menu." },
      { keys: ["ArrowDown", "ArrowUp"], does: "Moves the highlight. It loops." },
      { keys: ["Home", "End"], does: "Moves the highlight to the first or last option." },
      { keys: ["Enter"], does: "Picks the highlighted option and closes the menu." },
      { keys: ["Esc"], does: "Closes the menu and returns focus to the trigger." },
    ],
    notes: [
      "The search box shows from 7 options up, and typing filters on the label, the hint and the keywords.",
      "Under 7 options there's no search box. Focus goes to the list, and typing a letter jumps to the next option that starts with it.",
      'triggerLabel names the trigger. Make it say the field and its value, like "Priority: High".',
    ],
  },

  // Components: Navigation
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
  segmented: {
    keys: [
      {
        keys: ["ArrowRight", "ArrowLeft"],
        does: "In AnimatedTabs, moves to the next or previous segment and opens it.",
      },
      { keys: ["Home", "End"], does: "In AnimatedTabs, moves to the first or last segment." },
      {
        keys: ["Tab"],
        does: "In SegmentedFilter, moves to the next segment. The segments are separate stops.",
      },
      { keys: ["Space", "Enter"], does: "In SegmentedFilter, picks the focused segment." },
    ],
    notes: [
      "AnimatedTabs is a tablist with panels. SegmentedFilter is a group of buttons that report pressed. SegmentedNav is a nav of links, and the current one reports the page.",
      "Past the max, the extra segments fold into a More menu. It's a separate Tab stop after the strip, and it takes the picker's keys: arrows, Home, End, Enter and a letter to jump.",
      "A segment that shows only a mark or icon is named by its label.",
      "With reduced motion on, the pill fades to the new segment. It doesn't slide.",
    ],
  },
  breadcrumb: {
    notes: [
      "It's a nav named \"breadcrumb\". The current page reports itself as the current page and isn't a link.",
      "The separators are hidden from screen readers.",
      'Breadcrumb.Ellipsis is hidden too. A trigger it sits in needs its own name, like the demo\'s "Toggle menu".',
    ],
  },
  toolbar: {
    keys: [
      { keys: ["Tab"], does: "Moves to the next control. The controls are separate stops." },
      { keys: ["Space", "Enter"], does: "Picks a tab or view, or opens a menu." },
    ],
    notes: [
      "In a narrow pane, the tab and view strips fold into dropdown menus named by tabsLabel and viewLabel, and the search folds into a button named by searchLabel.",
      'In a wide pane, the search box is named by searchLabel too, "Search" by default. ToolbarSearch on its own takes a label.',
      "It has no toolbar role, so the arrow keys don't move between its controls.",
    ],
  },
  sidebar: {
    keys: [
      { keys: ["Cmd+B", "Ctrl+B"], does: "Opens or closes the sidebar, anywhere on the page." },
    ],
    notes: [
      "The shortcut leaves typing alone: in a field it's still bold.",
      'The trigger is named "Toggle Sidebar" and reports whether the sidebar is open.',
      "The rail on the sidebar's edge is for the pointer only. It skips the Tab order.",
      "On a phone the sidebar opens as a sheet, so focus is trapped in it and Esc closes it.",
    ],
  },
};
