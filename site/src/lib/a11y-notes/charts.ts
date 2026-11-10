import type { A11yNote } from "#lib/a11y-notes.js";

/** The plot keys every cartesian chart shares, from the kit's ChartPlot. */
const chartKeys: A11yNote["keys"] = [
  { keys: ["Tab"], does: "Moves focus to the plot." },
  { keys: ["ArrowRight", "ArrowDown"], does: "Shows the next point's tooltip." },
  { keys: ["ArrowLeft", "ArrowUp"], does: "Shows the previous point's tooltip." },
  { keys: ["Home", "End"], does: "Shows the first or last point." },
  { keys: ["Esc"], does: "Hides the tooltip." },
];

export const chartNotes: Record<string, A11yNote> = {
  // Charts
  "area-chart": {
    keys: chartKeys,
    notes: [
      'The plot is named by label, "Area chart" by default. A summary follows the name: the range, then each series\' first, last, low and high value.',
      "The keys read out the point they land on and show the same tooltip as hover.",
      "A hidden table lists every point for a screen reader to browse.",
      "With reduced motion on, the area draws in place without the reveal.",
    ],
  },
  "line-chart": {
    keys: chartKeys,
    notes: [
      'The plot is named by label, "Line chart" by default. A summary follows the name: the range, then each series\' first, last, low and high value.',
      "The keys read out the point they land on and show the same tooltip as hover.",
      "A hidden table lists every point for a screen reader to browse.",
      "With reduced motion on, the line draws in place without the reveal.",
    ],
  },
  "bar-chart": {
    keys: chartKeys,
    notes: [
      'The plot is named by label, "Bar chart" by default. A summary follows the name: the range, then the first, last, low and high value.',
      "The keys read out the bar they land on and show the same tooltip as hover.",
      "A hidden table lists every bar for a screen reader to browse. xLabel and yLabel name its columns.",
      "With reduced motion on, the bars show without growing in.",
    ],
  },
  "time-series-chart": {
    keys: chartKeys,
    notes: [
      "The plot is named by ariaLabel, or by label without one. A summary follows the name: the date range, then each line's first, last, low and high value.",
      "The keys read out the day they land on and show the same tooltip as hover.",
      "A hidden table lists every day for a screen reader to browse.",
    ],
  },
  "donut-chart": {
    notes: [
      'The chart is an image named by centerLabel and the total, like "Revenue: 12,400 total". The slices aren\'t in the name, so list them in text or a legend.',
      "With reduced motion on, the slices show without sweeping in.",
    ],
  },
  "ring-chart": {
    notes: [
      'The chart is an image named "Total" and the sum, unless you pass ariaLabel. The rings aren\'t in the name.',
      "With reduced motion on, the rings show without sweeping in.",
    ],
  },
  "gauge-chart": {
    notes: [
      'The gauge is an image named by its value, like "Gauge at 72%". Pass ariaLabel to say what it measures.',
      "With reduced motion on, the arc shows without filling in.",
    ],
  },
  "number-chart": {
    notes: [
      "The number is plain text. With reduced motion on, it shows the final value with no count.",
      'The change reads with its direction, like "up 8%" or "down 1%". The arrow itself is hidden.',
      "The share rail is an image named by its label and percent.",
    ],
  },
  sparkline: {
    keys: chartKeys,
    notes: [
      'A sparkline is named by label, "Sparkline" by default, with a summary of its range, first, last, low and high value.',
      "The arrow keys step through its points and show the same tooltip as on hover, and read out the point.",
      "With bare set, it's hidden from screen readers and takes no focus.",
    ],
  },
  "stat-card": {
    notes: [
      'The label and value are plain text. The trend chart is an image named by the label plus "trend".',
      "The change arrow is hidden from screen readers.",
    ],
  },
};
