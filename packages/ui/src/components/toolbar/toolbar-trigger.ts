import { cn } from "#src/lib/utils.js";

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
    // The outline button's edge: a real border plus the resting shadow. A `ring-1` hairline
    // shares box-shadow with `shadow-btn` and drew a broken edge beside Display (26 Oct 2026).
    "t-press inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border font-medium shadow-btn transition-[background-color,border-color,color] duration-quick ease-smooth-out hover:border-foreground/15 motion-reduce:transition-none",
    "h-7 px-2.5 text-xs any-pointer-coarse:h-11 any-pointer-coarse:px-3",
    // Active is a selected state, so it may tint; the tint reads off the foreground and
    // shows on the canvas, where bg-muted vanished.
    active
      ? "bg-foreground/6 text-foreground"
      : "bg-card text-muted-foreground hover:bg-foreground/3 hover:text-foreground",
    className,
  );
}
