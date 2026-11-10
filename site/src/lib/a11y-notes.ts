/** What the keyboard does on a component. Each string in `keys` is one alternative; "Shift+Tab" is a chord. */
export type A11yNote = { keys?: { keys: string[]; does: string }[]; notes?: string[] };

// Behaviour comes from Bits UI where the part wraps it: https://bits-ui.com/docs/components/<name>.
// Other entries come from the kit's source. A gap note stays until the kit fixes it.
/** The plot keys every cartesian chart shares, from the kit's ChartPlot. */
const chartKeys: A11yNote["keys"] = [
  { keys: ["Tab"], does: "Moves focus to the plot." },
  { keys: ["ArrowRight", "ArrowDown"], does: "Shows the next point's tooltip." },
  { keys: ["ArrowLeft", "ArrowUp"], does: "Shows the previous point's tooltip." },
  { keys: ["Home", "End"], does: "Shows the first or last point." },
  { keys: ["Esc"], does: "Hides the tooltip." },
];

export const a11yNotes: Record<string, A11yNote> = {
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
      "With free set there are no suggestions: Enter, comma, Space or Tab adds what's typed.",
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

  // Effects
  "text-effect": {
    notes: [
      "A screen reader hears the whole line once. The split pieces that animate are hidden from it.",
      "With reduced motion on, the text shows at once.",
    ],
  },
  marquee: {
    notes: [
      "The repeated copies are inert and hidden from screen readers, so the content is read once and its links take focus once.",
      "It pauses while focus is inside it, so a focused link holds still.",
      "With reduced motion on, it stands still. It also pauses offscreen and in a hidden tab.",
      "pauseOnHover pauses it under a mouse too.",
    ],
  },
  spotlight: {
    notes: ["With reduced motion on, the light shows in place without sweeping in."],
  },
  "border-beam": {
    notes: ["With reduced motion on, the beam doesn't travel around the edge."],
  },
  "magic-card": {
    notes: [
      "The glow follows the pointer only. A keyboard user sees the plain card.",
      "With reduced motion on, the glow moves without easing.",
    ],
  },
  "animated-beam": {
    notes: ["With reduced motion on, the path stays drawn but the light doesn't travel along it."],
  },
  "shader-gradient": {
    notes: [
      "It's hidden from screen readers.",
      "With reduced motion on, it draws a still frame. It also pauses offscreen and in a hidden tab.",
    ],
  },
  "in-view": {
    notes: ["With reduced motion on, the content shows at once with no fade or blur."],
  },
  "animated-group": {
    notes: ["With reduced motion on, every child shows at once and nothing staggers."],
  },
  "image-reveal": {
    notes: [
      "The image is drawn on a canvas hidden from screen readers. Describe it in text nearby.",
      "With reduced motion on, it appears and fades at once.",
    ],
  },
  magnetic: {
    notes: [
      "The pull follows the pointer only. Keyboard focus doesn't move the element.",
      "With reduced motion on, there's no pull at all.",
    ],
  },
  "interactive-hover-button": {
    keys: [
      {
        keys: ["Space", "Enter"],
        does: "Presses the button. With href it's a link, and only Enter follows it.",
      },
    ],
    notes: [
      "The duplicate label and arrow that slide in on hover are hidden from screen readers.",
      "With reduced motion on, the spinning edge stops.",
    ],
  },
  "image-comparison": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the divider." },
      { keys: ["ArrowLeft", "ArrowDown"], does: "Moves the divider left one percent." },
      { keys: ["ArrowRight", "ArrowUp"], does: "Moves the divider right one percent." },
      { keys: ["Home"], does: "Moves the divider to the left edge." },
      { keys: ["End"], does: "Moves the divider to the right edge." },
    ],
    notes: [
      "The divider is a real range input named by label. Both images keep their own alt.",
      "Pressing a key stops the hint animation.",
      "With reduced motion on, the hint doesn't play and the divider moves without easing.",
    ],
  },

  // Charts
  "area-chart": {
    keys: chartKeys,
    notes: [
      'The plot is named by label, "Area chart" by default. A summary follows the name: the range, then each series\' first, last, low and high value.',
      "The keys read out the point they land on and show the same tooltip as hover.",
      "A hidden table lists every point for a screen reader to browse.",
      "With reduced motion on, the area draws in place without the reveal.",
    ],
  },
  "line-chart": {
    keys: chartKeys,
    notes: [
      'The plot is named by label, "Line chart" by default. A summary follows the name: the range, then each series\' first, last, low and high value.',
      "The keys read out the point they land on and show the same tooltip as hover.",
      "A hidden table lists every point for a screen reader to browse.",
      "With reduced motion on, the line draws in place without the reveal.",
    ],
  },
  "bar-chart": {
    keys: chartKeys,
    notes: [
      'The plot is named by label, "Bar chart" by default. A summary follows the name: the range, then the first, last, low and high value.',
      "The keys read out the bar they land on and show the same tooltip as hover.",
      "A hidden table lists every bar for a screen reader to browse. xLabel and yLabel name its columns.",
      "With reduced motion on, the bars show without growing in.",
    ],
  },
  "time-series-chart": {
    keys: chartKeys,
    notes: [
      "The plot is named by ariaLabel, or by label without one. A summary follows the name: the date range, then each line's first, last, low and high value.",
      "The keys read out the day they land on and show the same tooltip as hover.",
      "A hidden table lists every day for a screen reader to browse.",
    ],
  },
  "donut-chart": {
    notes: [
      'The chart is an image named by centerLabel and the total, like "Revenue: 12,400 total". The slices aren\'t in the name, so list them in text or a legend.',
      "With reduced motion on, the slices show without sweeping in.",
    ],
  },
  "ring-chart": {
    notes: [
      'The chart is an image named "Total" and the sum, unless you pass ariaLabel. The rings aren\'t in the name.',
      "With reduced motion on, the rings show without sweeping in.",
    ],
  },
  "gauge-chart": {
    notes: [
      'The gauge is an image named by its value, like "Gauge at 72%". Pass ariaLabel to say what it measures.',
      "With reduced motion on, the arc shows without filling in.",
    ],
  },
  "number-chart": {
    notes: [
      "The number is plain text. With reduced motion on, it shows the final value with no count.",
      'The change reads with its direction, like "up 8%" or "down 1%". The arrow itself is hidden.',
      "The share rail is an image named by its label and percent.",
    ],
  },
  sparkline: {
    keys: chartKeys,
    notes: [
      'A sparkline is named by label, "Sparkline" by default, with a summary of its range, first, last, low and high value.',
      "The arrow keys step through its points and show the same tooltip as on hover, and read out the point.",
      "With bare set, it's hidden from screen readers and takes no focus.",
    ],
  },
  "stat-card": {
    notes: [
      'The label and value are plain text. The trend chart is an image named by the label plus "trend".',
      "The change arrow is hidden from screen readers.",
    ],
  },

  // Blocks: Chat
  message: {
    notes: [
      "Message is layout only, with no role. Put messages in a MessageScroller or your own list.",
      'align="end" flips the row with CSS only, so the reading order stays avatar, then content.',
    ],
  },
  attachment: {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the card's trigger, then to each action button." },
      { keys: ["Space", "Enter"], does: "Runs the focused trigger or action." },
    ],
    notes: [
      "Attachment.Trigger is a button stretched over the whole card. With no aria-label, it's named by the card's Attachment.Title.",
      'An icon-only Attachment.Action with no aria-label reads "Remove", with the title as its description. Pass an aria-label for any other action.',
      "The card shows a ring while anything inside it has focus.",
      "Upload and error states are colour and shimmer only. Say the state in Attachment.Description so a screen reader hears it.",
    ],
  },
  marker: {
    notes: [
      'Marker has no role. Add role="status" to one that changes live, like "Thinking...", so it\'s read out.',
      "Marker.Icon is hidden from screen readers. The text carries the meaning.",
      "With reduced motion on, the shimmer stops.",
    ],
  },
  "message-scroller": {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves focus to the thread, then to the scroll button when it shows.",
      },
      {
        keys: ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"],
        does: "Scrolls the thread and stops it following new messages.",
      },
      { keys: ["Space", "Enter"], does: "On the scroll button, jumps to the end." },
    ],
    notes: [
      'The thread is a region named "Messages" that takes focus.',
      "The message list is a log, so new messages are read out as they arrive.",
      'The scroll button is named "Scroll to end" or "Scroll to start".',
      "After the jump the button hides and focus moves to the thread.",
    ],
  },
  trace: {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next step that opens." },
      { keys: ["Space", "Enter"], does: "Opens or closes the focused step." },
    ],
    notes: [
      "A step that opens is a button that reports open or closed.",
      'The step icons are hidden from screen readers, so the title has to say what happened, like "Run failed".',
      "The trace isn't a live region. New steps aren't read out.",
      "With reduced motion on, the running shimmer and the open animation stop.",
    ],
  },
  suggestion: {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next suggestion." },
      { keys: ["Space", "Enter"], does: "Picks the focused suggestion." },
    ],
    notes: [
      'The row is a group named "Suggestions". Pass label to say more, like "Suggested prompts".',
    ],
  },
  "ai-prompt": {
    keys: [
      { keys: ["Enter"], does: "Sends the message, unless enterSubmits is false." },
      { keys: ["Shift+Enter"], does: "Adds a new line." },
      { keys: ["Cmd+Enter", "Ctrl+Enter"], does: "Always sends, even when enterSubmits is false." },
      {
        keys: ["Space", "Enter"],
        does: "On the submit button, sends. While a reply runs, stops it.",
      },
    ],
    notes: [
      "Enter does nothing while an input method is still composing, or while the submit button is disabled.",
      'The submit button is named "Submit", then "Stop" while a reply runs. submitLabel and stopLabel change them.',
      "Enter in the box while a reply runs does nothing, and the text stays. Use the Stop button.",
      'The box is named "Message" by default. label changes it.',
      "A send error shows as an alert, so it's read out right away.",
    ],
  },
  "ai-button": {
    keys: [{ keys: ["Space", "Enter"], does: "Runs the action." }],
    notes: [
      "The icon button is named by label, then by processingLabel while it works.",
      "While it works it reports disabled and ignores presses, and focus stays on it.",
      "Nothing is read out when the work finishes. Change the label, as the demo does, or announce it yourself.",
    ],
  },
  reasoning: {
    keys: [{ keys: ["Space", "Enter"], does: "Opens or closes the reasoning." }],
    notes: [
      "The trigger is a button that reports open or closed.",
      "It opens by itself when streaming starts and closes when it ends. Focus doesn't move.",
      'The label changes from "Thinking..." to "Thought for 4s", but that change isn\'t read out.',
      "With reduced motion on, the open animation and the pulsing icon stop.",
    ],
  },
  confirmation: {
    keys: [
      { keys: ["Tab"], does: "Moves focus between the action buttons." },
      { keys: ["Space", "Enter"], does: "Runs the focused action." },
    ],
    notes: [
      'The box is a region named "Confirmation". It reports busy while the action runs.',
      "It's a polite live region from the moment it shows, so the result is read out.",
      "While the action runs the buttons report disabled and focus stays put. Once it resolves the buttons go away and focus moves to the box.",
      "With reduced motion on, the state swap doesn't animate.",
    ],
  },
  "chat-typing": {
    notes: [
      "With no label, the dots are hidden from screen readers.",
      "Set label and the dots become a status, and the label is read out.",
      "With reduced motion on, the dots stop bouncing.",
    ],
  },
  "loading-state": {
    notes: [
      "The loader is a status named by its label, so a screen reader hears what the agent is doing.",
      "The elapsed clock sits inside the status, so some screen readers read every tick. Set elapsed={false} if that's noisy.",
      "With reduced motion on, the grid and the shimmer stop.",
    ],
  },
  "generation-progress": {
    notes: [
      'The bar is a progressbar named by the label, with a value like "2 of 5" once it knows the step count.',
      'A polite status says each new step, like "Writing the proposal: Outlining 3 sections", and says "Generation failed".',
      "The copy of the label drawn for the shimmer is hidden from screen readers.",
      "With reduced motion on, the shimmer, the pulse and the sweep stop.",
    ],
  },
  "voice-waveform": {
    notes: [
      "The waveform is hidden from screen readers and doesn't say whether it's live.",
      "Put it inside a control that carries the name and state, like the demo's button that reports pressed.",
      "With reduced motion on, the bars stop moving.",
    ],
  },

  // Blocks: Agents
  "agent-avatar": {
    notes: [
      'The avatar is an image named by name and role, like "Ada, Researcher". Pass aria-hidden when text beside it already names the agent.',
      "When a name is set, the state, like working, drops out of the name.",
      "A click makes it jump. That's decoration, so it stays an image and takes no focus.",
      "With onclick set, it's a button named the same way, so the action takes focus, Enter and Space.",
      "With reduced motion on, it draws one still frame.",
    ],
  },
  "agent-cast": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next card." },
      { keys: ["Space", "Enter"], does: "Selects the focused agent." },
    ],
    notes: [
      "The cards are buttons in a list, under a heading when agents have a group.",
      "With onSelect set, the selected card reports pressed.",
      "The avatar inside is hidden, so the card is named by the agent's name and role.",
      "Focus wakes an avatar the same way hover does.",
    ],
  },

  // Blocks: Work
  "status-dot": {
    notes: [
      "The dot is hidden from screen readers and takes no label. Print the status word beside it, as the demo does.",
      "With reduced motion on, the pop, fill and tick don't animate.",
    ],
  },
  "status-badge": {
    notes: [
      "The badge is plain text, so a screen reader reads its label.",
      "A status icon before the label is hidden from screen readers, since the label says the same.",
      'With busy set, the spinner is hidden and the label reads with ", working" after it. busyLabel changes the word.',
    ],
  },
  "status-icon": {
    notes: [
      "The icon is hidden from screen readers, so print the status word beside it.",
      'Alone, with no word beside it, pass label, like label="Passed", and it reads as an image with that name.',
      "A status without an icon falls back to the dot, named the same way.",
    ],
  },
  "work-parts": {
    notes: [
      'GroupHead\'s plus button is named by the add label and the group, like "Add: In progress".',
      "PropertyRow is a group named by its label, so the value is read with its label even where a narrow row hides it.",
      "WorkCard and WorkWell take no focus. Put a button or a link in a card that opens something.",
    ],
  },
  "task-list": {
    keys: [
      { keys: ["Tab"], does: "Moves through each group's fold and add buttons, then its rows." },
      { keys: ["Space", "Enter"], does: "On a fold button, folds or opens the group." },
      {
        keys: ["Alt+ArrowDown"],
        does: "Moves the focused row to the next group down that takes it. Focus stays on the row.",
      },
      {
        keys: ["Alt+ArrowUp"],
        does: "Moves the focused row to the next group up that takes it. Focus stays on the row.",
      },
    ],
    notes: [
      "A group is a section with a list of rows inside. The fold button reports open or closed.",
      "In manual order a moved row lands at the end of its new group. A folded group opens when a row moves into it.",
      "A keyboard move ends with a live region saying Moved to and the group's name. movedLabel changes the words.",
      "A row is named by its own text, or by getLabel. The move hint is its description, and moveHint changes it.",
      "A folded group's rows leave the Tab order and aren't read out.",
      "With draggable off, rows take no focus and the move keys are off.",
      "With reduced motion on, rows, folds and the drop line don't animate.",
    ],
  },
  "kanban-board": {
    keys: [
      { keys: ["Tab"], does: "Moves through each column's buttons and cards in order." },
      {
        keys: ["Alt+ArrowRight"],
        does: "Moves the focused card to the next column that takes it. Focus stays on the card.",
      },
      {
        keys: ["Alt+ArrowLeft"],
        does: "Moves the focused card to the previous column that takes it. Focus stays on the card.",
      },
      { keys: ["Space", "Enter"], does: "On a card, selects it when the board has onSelect." },
    ],
    notes: [
      "A keyboard move ends with a live region saying Moved to and the column's name. movedLabel changes the words.",
      "Hidden columns and columns that refuse the card are skipped. In manual order the card lands at the end, or at the top of a capped column.",
      "A column is a region named after it, and its cards form a list.",
      "A card is named by its own text, or by getLabel. The move hint is its description, and moveHint changes it.",
      'Cards past the limit sit in a fold that can\'t be reached while shut. "Show N more" opens it.',
      "With reduced motion on, cards, folds and columns don't animate.",
    ],
  },
  "task-gantt": {
    keys: [
      { keys: ["Tab"], does: "Moves through the fold buttons and the bars." },
      { keys: ["ArrowLeft", "ArrowRight"], does: "Moves the focused bar a day earlier or later." },
      { keys: ["Shift+ArrowRight"], does: "Moves the bar's end a day later, so the task grows." },
      {
        keys: ["Shift+ArrowLeft"],
        does: "Moves the bar's end a day earlier, never before its start.",
      },
      { keys: ["Space", "Enter"], does: "Selects the focused bar, milestone flag or summary bar." },
    ],
    notes: [
      "A bar is a button named by the task's title and dates, plus a hint about the arrow keys when the chart is editable.",
      "Without onChange the arrow keys do nothing and the chart is read only.",
      "No key moves a bar's start alone. Move the bar, then fix its end with Shift.",
      "Milestone flags and a parent's summary bar can be selected but not moved.",
      'After an arrow key, a live region reads the new dates, like "Now Nov 5 to Nov 9, 5 days". movedLabel changes the words. Focus stays on the bar.',
      "With reduced motion on, bars, tips and folds don't animate.",
    ],
  },
  "side-panel": {
    keys: [
      { keys: ["Tab"], does: "Moves focus to the next control inside the panel." },
      { keys: ["Shift+Tab"], does: "Moves focus to the previous control inside the panel." },
      { keys: ["Esc"], does: "Closes the panel and returns focus to what opened it." },
    ],
    notes: [
      "It's a dialog named by its title and described by its description.",
      "On open, focus goes to the panel itself, or to the first field when a text field comes first.",
      "Tab can't leave the panel while it's open.",
      'The close button is named "Close". Open-in links open a new tab and are named by their label.',
    ],
  },
  thread: {
    keys: [
      { keys: ["Tab"], does: "Moves through each comment's buttons, then the composer." },
      { keys: ["Cmd+Enter", "Ctrl+Enter"], does: "Sends the comment or reply from its text box." },
      { keys: ["Esc"], does: "In a reply or edit box, cancels it." },
    ],
    notes: [
      "The thread is a section named by its title. Comments are a list, with replies nested under them.",
      "Resolve, edit and delete show on hover, or as soon as focus enters the comment.",
      "Opening a reply or an edit puts focus in its box.",
      "Save, Cancel and Esc return focus to Edit. Closing or sending a reply returns it to Reply.",
      "After a delete, focus goes to the next comment, or the one before when it was the last.",
      'Resolve is a toggle that reports pressed. "Show resolved" reports open or closed.',
      "An agent's name is followed by a hidden word saying it's an agent.",
    ],
  },
  "threaded-inbox": {
    keys: [
      { keys: ["j"], does: "Opens the next thread and focuses its row." },
      { keys: ["k"], does: "Opens the previous thread and focuses its row." },
      { keys: ["u"], does: "Marks the open thread read, or unread." },
      { keys: ["Alt+U"], does: "Marks every thread read." },
      { keys: ["h"], does: "Opens the snooze choices, or brings a snoozed thread back." },
      {
        keys: ["1", "2", "3"],
        does: "With snooze open, snoozes for 3 hours, until 9:00 tomorrow or until 9:00 next Monday.",
      },
      { keys: ["Esc"], does: "Closes the snooze choices." },
      { keys: ["Shift+S"], does: "Unfollows the open thread." },
      {
        keys: ["Backspace"],
        does: "Clears the open thread and opens the next one. A thread waiting on a decision stays.",
      },
      { keys: ["Shift+Backspace"], does: "Clears every thread that's read and waits on nothing." },
      {
        keys: ["a", "d", "s", "e"],
        does: "On a pending proposal: approve, decline, steer or edit the draft.",
      },
    ],
    notes: [
      "The keys work only while focus is inside the inbox, and never while you type in a field.",
      "A key does nothing unless the host passes its handler, like onReadAll for Alt+U or onClear for Backspace.",
      "The buttons announce their keys through aria-keyshortcuts.",
      "Threads are a list, and the open row reports itself as current.",
      "The key hints under the inbox are hidden on a phone.",
    ],
  },
  "triage-queue": {
    keys: [
      { keys: ["Tab"], does: "Moves through each card's buttons." },
      { keys: ["Enter"], does: "In the task field, runs the task you typed." },
      { keys: ["Esc"], does: "In the task field, cancels it." },
    ],
    notes: [
      "The actions are plain buttons, with no shortcuts.",
      "A plan card is named by its heading, the sender and subject.",
      "Errors are alerts, so they're read out as soon as they show.",
      "While the call runs, Approve, Dismiss and Use task report unavailable and ignore presses. Focus stays on the one you pressed.",
      "Pick another task puts focus in its field. Cancel and Esc put it back on Pick another task.",
      "When a card leaves the queue, focus goes to the card now in its place, or to the empty message.",
    ],
  },

  // Blocks: Editor
  "inline-editor": {
    keys: [
      { keys: ["Cmd+B"], does: "Bold." },
      { keys: ["Cmd+I"], does: "Italic." },
      { keys: ["Cmd+Shift+X", "Cmd+Shift+S"], does: "Strikethrough." },
      { keys: ["Cmd+E"], does: "Inline code." },
      { keys: ["Cmd+Shift+8"], does: "Bullet list." },
      { keys: ["Cmd+Shift+7"], does: "Numbered list." },
      { keys: ["Cmd+K"], does: "Asks the host for a link, through onlink." },
      { keys: ["Cmd+Z"], does: "Undo." },
      { keys: ["Cmd+Shift+Z", "Cmd+Y"], does: "Redo." },
      { keys: ["Enter"], does: "In a list, starts a new item." },
      {
        keys: ["Shift+Tab"],
        does: "In a list, lifts the item out. From a plain paragraph, leaves the field.",
      },
      { keys: ["Tab"], does: "Does nothing, so lists stay flat." },
      { keys: ["Esc"], does: "Calls onexit. The host decides where focus goes." },
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
      { keys: ["Esc"], does: "Closes the command menu." },
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
      "Toolbar buttons report pressed and are separate Tab stops. The arrow keys don't move along the toolbar.",
      "Focus stays in the text while the command menu is open. The text points at the highlighted command, so a screen reader reads it as it moves.",
      "The link field's Cancel button is named Cancel link.",
      "Arrowing onto an image selects it and opens its toolbar. Tab moves into the toolbar to align or delete it.",
      "Checklist boxes are named by their line.",
      "Image and YouTube inserts ask through the browser's prompt box.",
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
    ],
    notes: [
      "Rows are buttons, and the open one reports itself as current.",
      "The filter tabs are a named group of buttons that report pressed.",
      "The search field has only its placeholder for a name.",
      "Under 1024px wide, the list and the record take turns. Picking a row moves focus into the record, and the back button returns it to that row.",
      "With reduced motion on, the list-to-record slide doesn't play.",
    ],
  },
  dashboard: {
    keys: [
      {
        keys: ["Tab"],
        does: "Moves through the period filter, linked tiles, column sort buttons and row links.",
      },
      { keys: ["Space", "Enter"], does: "On a column's sort button, sorts by it." },
    ],
    notes: [
      "The period filter is a named group of buttons that report pressed, or links when href is set.",
      "The table has real column headers. A sortable head holds a button and reports its sort order.",
      'A tile\'s change reads with its direction, like "up 8%".',
      "Every chart here is named and summarised, holds a hidden table of its values, and the arrow keys step its tooltip.",
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
      "With reduced motion on, the morph between slides is skipped.",
    ],
  },

  // Blocks: Canvas
  canvas: {
    keys: [
      { keys: ["Tab"], does: "Moves between the tool buttons and the nodes." },
      { keys: ["Space", "Enter"], does: "Selects the focused node." },
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
      "Tool buttons are named and report pressed. resolveToolKey turns a key press into the tool, so a host binds the letters in one line.",
      'A node is named by its words: "Draw on me", "Rectangle: Idea", or "Pen stroke" for a drawing. The name follows edits.',
      "Drawing, placing a shape or text, connecting nodes and resizing a shape are still pointer only.",
      "Enter doesn't open a node's text yet. The host owns that key and calls requestStartEdit.",
      "A node's text field keeps the keys you type in it, and Esc leaves it.",
      "With reduced motion on, the toolbar doesn't animate.",
    ],
  },
};
