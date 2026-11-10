import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "field",
    title: "With a label and hint",
    note: "Wrap the input in a Field so the label, the hint and the input line up and read as one.",
  },
  {
    name: "disabled",
    title: "Disabled",
    note: "A disabled input dims, takes no clicks and drops out of the tab order.",
  },
  {
    name: "invalid",
    title: "Invalid",
    note: "Set aria-invalid on the input and the border and ring turn red, with the error read out below.",
  },
  {
    name: "file",
    title: "File",
    note: "Set type to file and bind files to get the FileList back.",
  },
] satisfies Example[];
