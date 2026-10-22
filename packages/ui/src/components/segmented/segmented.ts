import { tv } from "tailwind-variants";
import { pageGutterClass } from "#src/lib/layout.js";

/**
 * The one look for a segmented control: the track and trigger here, what a
 * segment says in `segment.svelte`.
 */

// WHY a recipe, not one component: tabs are a `tablist`, filters a `group` of
// `aria-pressed` toggles, page links a `nav`. Only the ARIA shape may differ.

// The look used to drift three ways, one with an at-rest shadow. All three read from here now.
export const segmentedTrackClass = tv({
  // WHY the height lives on the track: it carries the inset, so an `h-7` trigger
  // drew 30px beside a 28px button. One toolbar row came out at five heights.

  // WHY no size variant: `sm` drew 24px, and every tab control must share one height.
  base: "h-7 any-pointer-coarse:h-11 shrink-0 items-stretch",
  variants: {
    // `pill`: a bordered well with a travelling highlight. `underline`: bare
    // labels over one hairline, the active one marked by a rule that travels.
    variant: {
      pill: "overflow-hidden rounded-lg border border-border p-0.5 any-pointer-coarse:border-0 any-pointer-coarse:px-[3px] any-pointer-coarse:py-0",
      underline: "gap-5 border-b border-border",
    },
    // Fill the row rather than sit at its natural width. For a narrow rail.
    fill: { true: "flex w-full", false: "inline-flex w-fit" },
  },
  defaultVariants: { variant: "pill", fill: false },
});

export type SegmentedVariant = "pill" | "underline";

export const segmentedTriggerClass = tv({
  base: [
    // `t-press` is the kit's one press: colour, shadow and a pixel of travel.

    // `relative z-[1]` keeps the label above the travelling pill, or the pill
    // paints over the word it highlights.

    // `ui-segment` isn't a style. `segmented-track.svelte` matches on it to time
    // the label colour with the pill.
    "ui-segment group/segment t-press relative z-[1] inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium select-none",
    "text-muted-foreground hover:text-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // WHY an inset focus ring: the track clips to its rounded corners, so an
    // outside ring was cut in half on the end segments.
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none",
    // WHY no height on the trigger: an icon makes a segment taller than a word.
    // `h-full` against the track's `items-stretch` keeps every segment the same box.
    "h-full text-xs",
  ],
  variants: {
    // The pill sits concentric in the track's 2px inset; the underline has no well, so
    // no padding, and its rule is as wide as the label.
    variant: {
      pill: "rounded-[calc(var(--radius-lg)-3px)] px-2.5 any-pointer-coarse:px-3.5",
      underline: "rounded-sm px-0",
    },
    // WHY `min-w-fit flex-auto`, not equal fractions: fractions cut "Approved" to
    // "Appro…" in a 280px rail. Each segment claims its label and shares the slack.
    fill: { true: "min-w-fit flex-auto", false: "" },
    active: { true: "text-foreground", false: "" },
  },
  defaultVariants: { variant: "pill", fill: false, active: false },
});

/**
 * The row a segmented strip sits in, and the one recipe for a navigation row
 * under the app header. Written per caller it produced two different left
 * edges.
 */
// WHY no bottom hairline: with a section strip and a page toolbar stacked it
// drew two rules for one boundary. The gap is the boundary.
export const segmentedRowClass = `flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 py-2 ${pageGutterClass}`;

/** The active style, for a strip whose state lives in a `data-active` attribute. */
export const segmentedActiveClass = "data-active:text-foreground";
