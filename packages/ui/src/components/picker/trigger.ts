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
    // 13px at weight 500 is Linear's own property row, measured 31 Aug 2026 on a
    // 16px root. 14px reads looser than the reference, and it shows in the sidebar.
    "t-press inline-flex min-w-0 items-center gap-1.5 rounded-md text-[13px] font-medium whitespace-nowrap select-none",
    "hover:bg-muted data-[state=open]:bg-muted",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  variants: {
    // Heights match `segmentedTrackClass`, so a strip and a picker line up.
    // Padding is 6px leading, 10px trailing: an even 8px shunted icon rows right.
    size: {
      sm: "h-6 ps-1.5 pe-2 any-pointer-coarse:h-9 any-pointer-coarse:pe-2.5",
      default: "h-7 ps-1.5 pe-2.5 any-pointer-coarse:h-10",
    },
    /**
     * Fill the row. Off by default: Linear's property rows sit at natural width
     * (80px for "Assign"), so a set of rows reads as a set of chips.
     */
    block: { true: "flex w-full", false: "w-fit" },
    /** No value yet: the label is a prompt, so it recedes until hovered. */
    empty: { true: "text-muted-foreground/70 hover:text-muted-foreground", false: "" },
    /** A row that carries no action still needs the column's box. */
    inert: { true: "hover:bg-transparent cursor-default", false: "" },
  },
  defaultVariants: { size: "default", block: false, empty: false, inert: false },
});
