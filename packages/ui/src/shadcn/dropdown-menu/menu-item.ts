import { tv, type VariantProps } from "tailwind-variants";

/**
 * The one row a menu is built from.
 */

/*
 * WHY it is a recipe and not only a component: `DropdownMenu.Item` needs a `DropdownMenu.Root` above it, and the diagram canvas has no trigger element to hang one on.
 */

/*
 * It opens its own panel at the pointer, so it drew its own rows: fifteen of them in `diagram-context-menu.svelte`, in four widths of gap and two paddings,
 */

/*
 * none of which could follow a change to the set.
 */

/*
 * WHY both `hover:` and `focus:`: bits-ui moves a `data-highlighted` focus ring with the keyboard and never fires hover, while a hand-rolled panel has only the pointer.
 */

/*
 * A row has to look the same either way, so it answers to both.
 */
export const menuItemClass = tv({
  base: "relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-disabled:pointer-events-none data-disabled:opacity-50 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      default:
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground",
      destructive:
        "text-destructive *:[svg]:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive dark:hover:bg-destructive/20 dark:focus:bg-destructive/20",
    },
    /** A row in a set where a sibling carries a leading mark. */
    inset: { true: "pl-7", false: "" },
    /** Panels that fill their width: a canvas menu, a picker column. */
    block: { true: "w-full", false: "" },
  },
  defaultVariants: { variant: "default", inset: false, block: false },
});

export type MenuItemVariant = VariantProps<typeof menuItemClass>["variant"];
