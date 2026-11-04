import { type VariantProps, tv } from "tailwind-variants";

export const badgeVariants = tv({
  // The chip radius, not a pill: DESIGN.md keeps `rounded-full` for status and counts,
  // which `StatusBadge` owns. Tabular figures so a count that ticks doesn't shift.
  base: "h-5 gap-1 rounded-sm border border-transparent px-2 py-0.5 text-xs font-medium tabular-nums has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! focus-visible:border-ring focus-visible:shadow-(--ring-focus) aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive group/badge inline-flex w-fit max-w-full shrink-0 items-center justify-center overflow-hidden whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] [&>svg]:pointer-events-none",
  variants: {
    // Three weights a label can carry: filled, tinted, outlined. Severity is the
    // `tone` prop, which reads `TONE_CLASS`, not a variant.
    variant: {
      default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
      outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
      // For a consumer that wants one "this is wrong" badge without a tone prop.
      destructive: "bg-destructive/10 text-destructive-ink [a]:hover:bg-destructive/20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
