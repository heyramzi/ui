import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "tones",
    title: "Tones",
    note: "Set tone for a severity and the badge draws an outlined chip in that colour, ignoring variant.",
  },
  {
    name: "with-icon",
    title: "With a dot or icon",
    note: "Put a dot or an icon before the label, and mark the icon with data-icon so the padding tightens.",
  },
  {
    name: "link",
    title: "As a link",
    note: "Pass href and the badge renders an anchor with a hover state.",
  },
] satisfies Example[];
