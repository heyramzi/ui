import { defineStatuses } from "../define-statuses.js";

/**
 * An example status map for a sales pipeline. Names are neutral on purpose:
 * swap the keys and labels for your own domain.
 */
export const salesStatuses = defineStatuses({
	new: { label: "New", tone: "accent", variant: "open" },
	contacted: { label: "Contacted", tone: "info", variant: "open" },
	proposal: { label: "Proposal", tone: "accent", variant: "progress", progress: 0.25 },
	negotiation: { label: "Negotiation", tone: "warning", variant: "progress", progress: 0.75 },
	won: { label: "Won", tone: "success", variant: "completed" },
	lost: { label: "Lost", tone: "destructive", variant: "lost" },
});

export type SalesStatus = (typeof salesStatuses.ids)[number];
