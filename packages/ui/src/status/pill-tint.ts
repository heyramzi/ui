import type { Tone } from "#src/lib/tone.js";

// A quiet tint and no border: the icon and the text carry the tone, the fill only groups
// them. Neutral reads off the foreground, not `bg-muted`, because muted sits 0.005 L from
// the canvas and vanishes there (tokens board, "what fights the new scale").
// It lives in a .ts module, not status-pill.svelte's module script, so a plain tsc consumer
// can import it: tsc's `*.svelte` shim only knows a default export.
export const PILL_TINT: Record<Tone, string> = {
  neutral: "bg-foreground/6 text-muted-foreground",
  accent:
    "bg-[color-mix(in_oklab,var(--tone-accent,var(--color-primary))_12%,transparent)] text-[color:var(--tone-accent,var(--color-primary))]",
  info: "bg-info/12 text-info-800 dark:text-info-400",
  success: "bg-success/12 text-success-800 dark:text-success-400",
  warning: "bg-warning/14 text-warning-800 dark:text-warning-400",
  destructive: "bg-destructive/10 text-destructive-ink",
};
