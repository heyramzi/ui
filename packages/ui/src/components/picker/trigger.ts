import { tv } from "tailwind-variants";

/**
 * The one look for a control that opens a picker, and for the plain values
 * that sit in the same column beside it.
 */
// WHY a recipe: a property row can be a menu trigger, a link or a plain
// string. All three draw the same box, and only one is a button.

// It replaced eight geometries in one sidebar: three heights, three radii, two
// paddings, and a border on three rows out of eight.

// Borderless at rest on purpose. A value that's set is a fact to read, so the
// box shows only under the pointer and on focus.
export const pickerTriggerClass = tv({
  base: [
    // `length:` stops tailwind-merge reading `text-control` as a colour (craft.css, Type).
    "t-press inline-flex min-w-0 items-center gap-1.5 rounded-lg text-(length:--text-control) font-medium whitespace-nowrap select-none",
    // The hover box is a foreground tint: property rows sit on the canvas too, where bg-muted
    // is 0.005 L away and vanished. Radius is the control step, 10px.
    "transition-colors duration-quick ease-smooth-out hover:bg-foreground/6 data-[state=open]:bg-foreground/6 motion-reduce:transition-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  variants: {
    // Heights match `segmentedTrackClass`, so a strip and a picker line up.
    // Padding is 6px leading, 10px trailing: an even 8px shunted icon rows right.
    size: {
      sm: "h-6 ps-1.5 pe-2 any-pointer-coarse:h-11 any-pointer-coarse:pe-2.5",
      default: "h-7 ps-1.5 pe-2.5 any-pointer-coarse:h-11",
    },
    /**
     * Fill the row. Off by default: Linear's property rows sit at natural width
     * (80px for "Assign"), so a set of rows reads as a set of chips.
     */
    block: { true: "flex w-full", false: "w-fit" },
    /** No value yet: the label is a prompt, so it recedes until hovered. */
    empty: { true: "text-muted-foreground hover:text-foreground", false: "" },
    /** A row that carries no action still needs the column's box. */
    inert: { true: "hover:bg-transparent cursor-default", false: "" },
  },
  defaultVariants: { size: "default", block: false, empty: false, inert: false },
});
