import { cn } from "#src/lib/utils.js";

// The header for each control group in a toolbar popover, in one place so
// sections can't drift in size or weight.

// `first:` drops the leading header's top padding, since the popover pads itself.
export function filterSectionClass(className?: string): string {
  return cn("px-2 pt-2 pb-1 text-2xs font-medium text-muted-foreground first:pt-1", className);
}
