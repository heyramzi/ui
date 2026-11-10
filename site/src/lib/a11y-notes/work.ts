import type { A11yNote } from "#lib/a11y-notes.js";

export const workNotes: Record<string, A11yNote> = {
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
      "Without onDatesChange the arrow keys do nothing and the chart is read only.",
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
};
