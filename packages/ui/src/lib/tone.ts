export type Tone = "neutral" | "accent" | "info" | "success" | "warning" | "destructive";

/**
 * The severity scale, as Tailwind classes for a chip and as CSS colors for the
 * dot. Tokens are plain CSS variables, so a host app can retheme them. The
 * accent tone reads `--tone-accent` and falls back to `--color-primary`, for a
 * host whose primary is a neutral and whose accent is a brand color.
 */

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-border bg-muted/40 text-muted-foreground",
  accent:
    "border-[color-mix(in_oklab,var(--tone-accent,var(--color-primary))_30%,transparent)] bg-[color-mix(in_oklab,var(--tone-accent,var(--color-primary))_10%,transparent)] text-[color:var(--tone-accent,var(--color-primary))]",
  info: "border-info/30 bg-info/10 text-info-800 dark:text-info-400",
  success: "border-success/30 bg-success/10 text-success-800 dark:text-success-400",
  warning: "border-warning/30 bg-warning/10 text-warning-800 dark:text-warning-400",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

/** The same scale as text, for a verdict inside a line of muted facts. */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  accent: "text-[color:var(--tone-accent,var(--color-primary))]",
  info: "text-info-800 dark:text-info-400",
  success: "text-success-800 dark:text-success-400",
  warning: "text-warning-800 dark:text-warning-400",
  destructive: "text-destructive",
};

/** The same scale as icon color. */
export const TONE_ICON: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  accent: "text-[color:var(--tone-accent,var(--color-primary))]",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

/** The scale as CSS colors, for the SVG dot. */
export const TONE_COLOR: Record<Tone, string> = {
  neutral: "var(--color-muted-foreground)",
  accent: "var(--tone-accent,var(--color-primary))",
  info: "var(--color-info)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
};
