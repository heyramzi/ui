import type { Example } from "#lib/examples/index.js";

export default [
  {
    name: "two-axes",
    title: "Two value axes",
    note: 'Set axis: "right" on a series to give it its own scale on the right. Both axes share one grid, each axis takes its series\' colour, and the tooltip shows every series for the hovered day.',
  },
] satisfies Example[];
