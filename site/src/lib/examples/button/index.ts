import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "sizes",
    title: "Sizes",
    note: "3 heights, and each one turns square when you set icon.",
  },
  {
    name: "with-icon",
    title: "With an icon",
    note: "Mark the icon with data-icon and the padding on that side tightens to fit it.",
  },
  {
    name: "loading",
    title: "Loading",
    note: "A disabled button takes no clicks, and one waiting on a save adds a spinner where its icon goes.",
  },
  {
    name: "link",
    title: "As a link",
    note: "Pass href and the button renders an anchor that looks the same.",
  },
] satisfies Example[];
