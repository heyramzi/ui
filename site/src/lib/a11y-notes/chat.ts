import type { A11yNote } from "#lib/a11y-notes.js";

export const chatNotes: Record<string, A11yNote> = {
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
  "chatgpt-window": {
    notes: [
      "The window is a figure named after the conversation. A screen reader gets the messages as text, each opened by who said it, and skips the bar, the composer and the icons.",
      "Nothing in it takes focus or answers a click: every control is a drawing.",
      "With reduced motion on, the reveal doesn't play and the finished conversation shows.",
    ],
  },
  "claude-window": {
    notes: [
      "The window is a figure named after the conversation. A screen reader gets the messages as text, each opened by who said it, and skips the bar, the composer and the icons.",
      "Nothing in it takes focus or answers a click: every control is a drawing.",
      "With reduced motion on, the reveal doesn't play and the finished conversation shows.",
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
};
