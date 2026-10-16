import type { AgentShape } from "@heyramzi/ui/agents";

/** What the agent decided the touchpoint is: a fact to file, a task to do, or a call only a person makes. */
export type InboxKind = "information" | "action" | "decision";

/** `auto` was already done by the agent and can be undone. `ask` waits for a verdict. */
export type InboxTier = "auto" | "ask";

export type InboxState = "proposed" | "working" | "approved" | "declined" | "done" | "undone";

export type InboxSourceType = "call" | "email" | "slack" | "form";

/** The three outcomes of a reply draft. Decline is the only one that closes the item without a yes. */
export type InboxOutcome = "approve" | "decline" | "clarify";

/** An editable email, filled in from a template by the agent. */
export type InboxDraft = {
	/** The template it came from. Comes back in the verdict so the host knows which one was sent. */
	templateId: string;
	/** The button's word: "Pre-qualify", "Decline", "Clarify". */
	label: string;
	subject: string;
	body: string;
	outcome?: InboxOutcome;
};

/** What the agent wants to do, in one line, with the drafts it prepared. */
export type InboxProposal = {
	summary: string;
	detail?: string;
	drafts?: InboxDraft[];
	/** The draft to open on. Defaults to the first. */
	recommended?: string;
};

/** A short quote the agent read. */
export type InboxEvidence = {
	quote: string;
	/** Who said it, or where it sat: "Priya", "line 14". */
	by?: string;
	/** A position in the source, such as "12:41" in a call. */
	at?: string;
};

/** Where an item came from and what the agent made of it. Every verdict is traceable to this. */
export type InboxTrace = {
	source: {
		type: InboxSourceType;
		label: string;
		/** Display time, formatted by the host so server and browser agree. */
		at: string;
		href?: string;
	};
	evidence: InboxEvidence[];
	reasoning: string;
};

export type InboxConfidence = {
	/** 0 to 1. */
	score: number;
	/** What the agent couldn't tell. Shown when the agent is unsure. */
	missing?: string;
};

export type InboxProject = {
	id: string;
	name: string;
	client?: string;
	/** The project timeline. Decided items link here. */
	href?: string;
};

export type InboxAgent = {
	name: string;
	shape?: AgentShape;
	color?: string;
};

export type InboxItem = {
	id: string;
	kind: InboxKind;
	tier: InboxTier;
	state: InboxState;
	title: string;
	project: InboxProject;
	proposal: InboxProposal;
	confidence: InboxConfidence;
	trace: InboxTrace;
	agent?: InboxAgent;
	/** The last steer note, shown while the agent re-runs. */
	steer?: string;
};

/** The draft as the person left it, after editing. */
export type InboxDraftEdit = Pick<InboxDraft, "templateId" | "subject" | "body">;

export type InboxVerdict =
	| { type: "approve"; id: string; draft?: InboxDraftEdit }
	| { type: "decline"; id: string; draft?: InboxDraftEdit }
	| { type: "steer"; id: string; note: string }
	| { type: "undo"; id: string };

export type InboxLane = "needs" | "auto" | "decided";

export type InboxKindFilter = "all" | InboxKind;

/** What the person typed into the drafts, by template id. */
export type InboxDraftEdits = Record<string, { subject: string; body: string }>;
