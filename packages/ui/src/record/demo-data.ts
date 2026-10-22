// Fake data for the demo and the screenshots. Every name here is invented.
import type {
	FieldDef,
	FieldSectionDef,
	FieldValue,
	RecordEvent,
	RecordSummary,
	StageDef,
	StepDef,
	StepGroupDef,
} from "#src/record/types.js";

/** The demo's clock, so a screenshot reads the same on any day. */
export const DEMO_NOW = new Date("2026-10-21T12:00:00Z");
export const DEMO_TODAY = "2026-10-21";

export const stages: StageDef[] = [
	{ key: "lead", label: "Lead", tone: "neutral", category: "open" },
	{ key: "sent", label: "Proposal sent", tone: "info", category: "proposal" },
	{ key: "build", label: "In build", tone: "accent", category: "ongoing" },
	{ key: "paid", label: "Paid", tone: "success", category: "completed" },
	{ key: "lost", label: "Lost", tone: "destructive", category: "lost" },
];

export const stepGroups: StepGroupDef[] = [
	{ key: "sales", label: "Sales" },
	{ key: "delivery", label: "Delivery" },
];

export const websiteSteps: StepDef[] = [
	{ id: "s1", label: "Discovery call", done: true, group: "sales", start: "2026-10-03" },
	{ id: "s2", label: "Proposal", done: false, group: "sales", start: "2026-10-21" },
	{ id: "s3", label: "Kickoff", done: false, group: "delivery", start: "2026-10-26" },
	{ id: "s4", label: "Design review", done: false, group: "delivery", start: "2026-11-10" },
	{ id: "s5", label: "Build", done: false, group: "delivery", start: "2026-11-12", end: "2026-12-04" },
	{ id: "s6", label: "Cutover", done: false, group: "delivery", start: "2026-12-12", end: "2026-12-13" },
	{ id: "s7", label: "Training", done: false, group: "delivery", hidden: true },
];

export const projectSections: FieldSectionDef[] = [
	{ key: "scope", label: "Scope" },
	{ key: "loss", label: "Loss" },
];

export const projectFields: FieldDef[] = [
	{
		key: "type",
		label: "Type",
		type: "choice",
		section: "scope",
		options: [
			{ key: "strategy", label: "Strategy" },
			{ key: "implementation", label: "Implementation" },
		],
	},
	{ key: "budget", label: "Budget", type: "money", section: "scope" },
	{
		key: "urgency",
		label: "Urgency",
		type: "choice",
		section: "scope",
		options: [
			{ key: "low", label: "Low", tone: "neutral" },
			{ key: "high", label: "High", tone: "warning" },
		],
	},
	{ key: "goLive", label: "Go live", type: "date", section: "scope" },
	{ key: "context", label: "Context", type: "longtext", section: "scope" },
	{
		key: "reason",
		label: "Reason",
		type: "choice",
		section: "loss",
		showWhen: { key: "lossReasonOn", equals: "yes" },
		options: [{ key: "price", label: "Price" }],
	},
];

export const clientSections: FieldSectionDef[] = [{ key: "about", label: "About" }];

export const clientFields: FieldDef[] = [
	{ key: "business", label: "Business", type: "longtext", section: "about" },
	{
		key: "size",
		label: "Size",
		type: "choice",
		section: "about",
		options: [
			{ key: "1-10", label: "1 to 10" },
			{ key: "11-50", label: "11 to 50" },
			{ key: "51+", label: "51 or more" },
		],
	},
	{
		key: "sector",
		label: "Sector",
		type: "choice",
		section: "about",
		options: ["Dental", "Legal", "Retail", "Logistics", "Education", "Finance", "Health", "Hospitality", "Media"].map(
			(label) => ({ key: label.toLowerCase(), label }),
		),
	},
	{
		key: "needs",
		label: "Needs",
		type: "multi",
		section: "about",
		options: [
			{ key: "site", label: "Website" },
			{ key: "booking", label: "Booking" },
			{ key: "crm", label: "CRM" },
			{ key: "old", label: "Print", archived: true },
		],
	},
	{ key: "site", label: "Website", type: "url", section: "about" },
	{ key: "email", label: "Email", type: "email", section: "about" },
	{ key: "tz", label: "Time zone", type: "timezone", section: "about" },
];

export const websiteValues: Record<string, FieldValue> = {
	type: "implementation",
	budget: 12000,
	urgency: "high",
	goLive: "2026-12-14",
	context: "Replace the brochure site. Booking stays on the old tool until spring.",
};

export const clientValues: Record<string, FieldValue> = {
	business: "A dental group in Lyon with 3 clinics and a shared front desk.",
	size: "11-50",
	sector: "dental",
	needs: ["site", "booking", "old"],
	site: "https://marlowfinch.example",
	email: "jane@marlowfinch.example",
	tz: "Europe/Paris",
};

const note = (id: string, at: string, title: string, body?: string): RecordEvent => ({
	id,
	kind: "note",
	occurredAt: at,
	title,
	body,
	actor: "Ramzi",
});

export const websiteEvents: RecordEvent[] = [
	{
		id: "w1",
		kind: "status",
		occurredAt: "2026-10-18T09:30:00Z",
		title: "Sent SOW v2, legal is reviewing",
		body: "The payment terms have 2 redlines. Sofia answers Monday and asks for the signature by the 26th, so the kickoff holds.",
		actor: "Sofia",
	},
	{
		id: "w2",
		kind: "call",
		occurredAt: "2026-10-21T08:15:00Z",
		title: "Scoping review",
		body: "45 minutes with Jane and the clinic manager. Booking stays out of scope. They want the new site to carry the clinic pages and nothing else.",
		details: [
			{ label: "Length", value: "45 min" },
			{ label: "With", value: "Jane Roe, Tom Bell" },
		],
		href: "#call-scoping",
	},
	{
		id: "w3",
		kind: "stage",
		occurredAt: "2026-10-12T14:00:00Z",
		title: "Stage set to Proposal sent",
		actor: "Sofia",
	},
	note("w4", "2026-10-09T16:40:00Z", "Their fear is another agency that vanishes", "Said it twice. Lead the proposal with who answers the phone."),
	{
		id: "w5",
		kind: "invoice.sent",
		occurredAt: "2026-10-06T10:00:00Z",
		title: "Deposit invoice",
		amount: 3600,
		currency: "EUR",
	},
	{
		id: "w6",
		kind: "call",
		occurredAt: "2026-10-03T13:00:00Z",
		title: "Discovery call",
		body: "Jane runs 3 clinics and the site is 4 years old.",
	},
	{ id: "w7", kind: "milestone.done", occurredAt: "2026-10-03T15:00:00Z", title: "Discovery call done" },
	...Array.from({ length: 34 }, (_, i): RecordEvent => ({
		id: `old${i}`,
		kind: i % 3 === 0 ? "email" : "note",
		occurredAt: new Date(Date.UTC(2026, 8, 28 - i, 9, 0)).toISOString(),
		title: i % 3 === 0 ? "Re: clinic pages" : "Warm intro follow-up",
		actor: "Ramzi",
	})),
];

export const website: RecordSummary = {
	id: "p-web",
	name: "Website rebuild",
	href: "#project-web",
	stageKey: "sent",
	value: 12000,
	currency: "EUR",
	startDate: "2026-11-01",
	endDate: "2026-12-15",
	whereWeAre: {
		text: "Sent SOW v2, legal is reviewing. The payment terms have 2 redlines, Sofia answers Monday and asks for the signature by the 26th, so the kickoff holds.",
		at: "2026-10-18T09:30:00Z",
		actor: "Sofia",
		health: { label: "Waiting", tone: "warning" },
	},
	next: { label: "Kickoff call", date: "2026-10-26", owner: "Ramzi" },
	lastCallAt: "2026-10-21T08:15:00Z",
	lastTouchAt: "2026-10-21T08:15:00Z",
	progress: { done: 1, total: 6 },
};

export const audit: RecordSummary = {
	id: "p-audit",
	name: "Brand audit",
	href: "#project-audit",
	stageKey: "lost",
	stageDetail: "Price",
	value: 4500,
	currency: "EUR",
	whereWeAre: { text: "They went with a freelancer at half the fee.", at: "2026-06-11T10:00:00Z", actor: "Sofia" },
	lastCallAt: "2026-06-04T10:00:00Z",
	lastTouchAt: "2026-06-11T10:00:00Z",
	progress: { done: 1, total: 3 },
};

export const portal: RecordSummary = {
	id: "p-portal",
	name: "Booking portal",
	href: "#project-portal",
	stageKey: "paid",
	value: 18000,
	paid: 18000,
	currency: "EUR",
	whereWeAre: { text: "Live since March. Final invoice paid.", at: "2026-04-02T10:00:00Z", actor: "Ramzi" },
	lastCallAt: "2026-03-20T10:00:00Z",
	lastTouchAt: "2026-04-02T10:00:00Z",
	progress: { done: 5, total: 5 },
};

export const auditEvents: RecordEvent[] = [
	{
		id: "a1",
		kind: "stage",
		occurredAt: "2026-06-11T10:00:00Z",
		title: "Stage set to Lost",
		actor: "Sofia",
		details: [
			{ label: "Reason", value: "Price" },
			{ label: "In their words", value: "A freelancer quoted half." },
		],
	},
	{ id: "a2", kind: "call", occurredAt: "2026-06-04T10:00:00Z", title: "Proposal walk-through", body: "Jane liked the audit and balked at the fee." },
];

export const portalEvents: RecordEvent[] = [
	{ id: "b1", kind: "payment", occurredAt: "2026-04-02T10:00:00Z", title: "Final invoice paid", amount: 9000, currency: "EUR" },
	{ id: "b2", kind: "payment", occurredAt: "2026-02-10T10:00:00Z", title: "First instalment paid", amount: 9000, currency: "EUR" },
	{ id: "b3", kind: "call", occurredAt: "2026-03-20T10:00:00Z", title: "Launch check", body: "Live. A few copy fixes after." },
];

/** Something that happened before any project existed: it belongs to the client. */
export const clientOnlyEvents: RecordEvent[] = [
	{
		id: "c1",
		kind: "form",
		occurredAt: "2026-02-01T09:00:00Z",
		title: "Contact form: asked about online booking",
		body: "Calls pile up at lunch and the front desk can't keep up.",
	},
];

export const clientProjects = [
	{ summary: website, events: websiteEvents },
	{ summary: audit, events: auditEvents },
	{ summary: portal, events: portalEvents },
];
