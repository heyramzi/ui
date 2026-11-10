import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "disabled",
    title: "A disabled tab",
    note: "Set disabled on a trigger and it dims, takes no clicks and the arrow keys skip it.",
  },
  {
    name: "controlled",
    title: "Controlled",
    note: "Bind value to read or set the open tab from outside, here from a button below the tabs.",
  },
  {
    name: "with-icons",
    title: "With icons",
    note: "Put an icon before the label in a trigger and it sizes to 16px with a small gap.",
  },
  {
    name: "sizes",
    title: "Sizes",
    note: "Set size on the list for the same 3 heights a button has.",
  },
] satisfies Example[];
