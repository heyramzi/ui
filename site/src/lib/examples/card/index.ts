import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "with-action",
    title: "With an action",
    note: "Put a Card.Action in the header and it sits top right, beside the title and description.",
  },
  {
    name: "form",
    title: "A form with a footer",
    note: "Fields go in the content and the buttons in the footer, which a border-t class splits off with its own padding.",
  },
  {
    name: "stat",
    title: "Compact stat",
    note: "Set size to sm and the padding and gaps tighten, which suits a row of small number cards.",
  },
] satisfies Example[];
