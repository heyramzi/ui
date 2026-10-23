import { defineStatuses } from "#src/status/define-statuses.js";
import { ClipboardText, EnvelopeSimple, Hash, Phone } from "phosphor-svelte";
import type { PhosphorIcon } from "#src/lib/icon-types.js";
import type { InboxSourceType } from "#src/work/inbox/inbox-types.js";

/** The lifecycle of an item. The dot and the badge both read this one map. */
export const inboxStates = defineStatuses({
  proposed: { label: "Needs you", tone: "warning", variant: "open" },
  working: { label: "Agent working", tone: "accent", variant: "progress", progress: 0.6 },
  approved: { label: "Approved", tone: "success", variant: "completed" },
  declined: { label: "Declined", tone: "neutral", variant: "lost" },
  done: { label: "Done by agent", tone: "success", variant: "completed" },
  undone: { label: "Undone", tone: "neutral", variant: "lost" },
});

/** What the agent made of the touchpoint. */
export const inboxKinds = defineStatuses({
  information: { label: "Information", tone: "info", variant: "filled" },
  action: { label: "Action", tone: "accent", variant: "filled" },
  decision: { label: "Decision", tone: "warning", variant: "filled" },
});

/** How sure the agent is, bucketed. The dot's fill carries the exact score. */
export const inboxConfidence = defineStatuses({
  high: { label: "Confident", tone: "success", variant: "progress" },
  medium: { label: "Unsure", tone: "warning", variant: "progress" },
  low: { label: "Guessing", tone: "destructive", variant: "progress" },
});

export function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export const SOURCE_ICON: Record<InboxSourceType, PhosphorIcon> = {
  call: Phone,
  email: EnvelopeSimple,
  slack: Hash,
  form: ClipboardText,
};

export const SOURCE_LABEL: Record<InboxSourceType, string> = {
  call: "Call",
  email: "Email",
  slack: "Slack",
  form: "Form",
};
