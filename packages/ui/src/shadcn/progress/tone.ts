import type { Tone } from "#src/lib/tone.js";

/** The fill colour for each tone. No tone is the primary colour, as before. */
const FILL: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  accent: "bg-[color:var(--tone-accent,var(--color-primary))]",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

export function progressToneClass(tone?: Tone): string {
  return tone ? FILL[tone] : "bg-primary";
}
