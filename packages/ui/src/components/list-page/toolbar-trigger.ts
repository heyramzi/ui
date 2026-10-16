import { cn } from "@heyramzi/utils";

type ToolbarTriggerOpts = {
  active?: boolean;
  className?: string;
};

// The trigger class for every toolbar control. Coarse pointers get a taller
// box at the same type size, since the chip is too small for a thumb.

// One fixed height, matching the `sm` button and the segmented track. A second
// size put a 24px filter beside 28px controls on the calendar (14 Oct 2026).
export function toolbarTriggerClass({
  active = false,
  className,
}: ToolbarTriggerOpts = {}): string {
  return cn(
    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border font-medium transition-colors active:translate-y-px",
    "h-7 px-2.5 text-xs any-pointer-coarse:h-10 any-pointer-coarse:px-3",
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
    className,
  );
}
