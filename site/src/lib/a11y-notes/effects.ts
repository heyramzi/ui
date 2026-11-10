import type { A11yNote } from "#lib/a11y-notes.js";

export const effectNotes: Record<string, A11yNote> = {
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
};
