import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "groups",
    title: "Grouped options",
    note: "Put items in a Group with a GroupHeading, and a Separator between groups.",
  },
  {
    name: "disabled",
    title: "Disabled",
    note: "Disable the whole select on Root, or one option on its Item.",
  },
  {
    name: "invalid",
    title: "Invalid",
    note: "Set aria-invalid on the trigger and pair it with a Field error so the reason is read out.",
  },
] satisfies Example[];
