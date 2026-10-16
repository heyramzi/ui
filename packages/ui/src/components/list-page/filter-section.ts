import { cn } from "@heyramzi/utils";

// The header for each control group in a toolbar popover, in one place so
// sections can't drift in size or weight.

// `first:` drops the leading header's top padding, since the popover pads itself.
export function filterSectionClass(className?: string): string {
  return cn(
    "px-2 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground first:pt-1",
    className,
  );
}
