import { defineStatuses } from "@heyramzi/tasks/statuses";

/** The ring each filter tab and stage carries. Warn and faint keep review's text tokens over the tone colour. */
export const MARKS = defineStatuses({
  all: { label: "All", tone: "neutral", variant: "dashed", color: "var(--faint)" },
  todo: { label: "To do", tone: "warning", variant: "open", color: "var(--warn-text)" },
  needs: {
    label: "Needs you",
    tone: "warning",
    variant: "progress",
    progress: 0.25,
    color: "var(--warn-text)",
  },
  agents: { label: "Agents", tone: "accent", variant: "progress", progress: 0.5 },
  done: { label: "Done", tone: "success", variant: "completed" },
  kept: { label: "Kept", tone: "success", variant: "completed" },
  skipped: { label: "Skipped", tone: "neutral", variant: "lost", color: "var(--faint)" },
});

export type Mark = (typeof MARKS.ids)[number];
