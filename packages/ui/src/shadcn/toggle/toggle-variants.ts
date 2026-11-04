import { type VariantProps, tv } from "tailwind-variants";

export const toggleVariants = tv({
  base: "relative after:absolute after:top-1/2 after:left-1/2 after:h-[max(100%,2rem)] after:w-[max(100%,2rem)] after:-translate-x-1/2 after:-translate-y-1/2 any-pointer-coarse:after:h-[max(100%,2.75rem)] any-pointer-coarse:after:w-[max(100%,2.75rem)] hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground focus-visible:shadow-(--ring-focus) aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variants: {
    variant: {
      default: "bg-transparent",
      outline:
        "border-input hover:bg-accent hover:text-accent-foreground border bg-transparent shadow-btn",
    },
    size: {
      // Same steps as Button: sm 28, default 32, lg 36. 40 went with the scale.
      default: "h-8 min-w-8 px-2",
      sm: "h-7 min-w-7 px-1.5",
      lg: "h-9 min-w-9 px-2.5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
export type ToggleSize = VariantProps<typeof toggleVariants>["size"];
export type ToggleVariants = VariantProps<typeof toggleVariants>;
