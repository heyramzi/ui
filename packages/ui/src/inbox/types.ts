import type { InboxItem } from "#src/tasks/inbox/inbox-types.js";

export type InboxActorKind = "user" | "agent";

export type InboxActor = {
	kind: InboxActorKind;
	name: string;
	/** Image URL for a person. The host's own portrait goes through the `avatar` snippet. */
	avatar?: string;
};

export type InboxEntryKind = "comment" | "status" | "assigned" | "mention" | "agent_response" | "proposal";

/** What the thread is about: one task, project or doc. Entries with the same type and id share a thread. */
export type InboxSubject = {
	/** "task", "project", "doc" or whatever the host calls it. */
	type: string;
	id: string;
	/** The short reference, such as "TSK-7". */
	ref?: string;
	title: string;
	/** A status id the host draws itself, for a badge in the thread header. */
	status?: string;
	href?: string;
};

export type InboxEntry = {
	id: string;
	kind: InboxEntryKind;
	/** An entry with no subject id belongs to no thread and is dropped. */
	subject?: InboxSubject;
	actor: InboxActor;
	/** ISO timestamp. A malformed one sorts last. */
	at: string;
	read?: boolean;
	/** Text of a comment, a mention or an agent response. */
	body?: string;
	/** A `status` entry: where the subject moved. */
	status?: { from?: string; to: string };
	/** An `assigned` entry: who got the work. */
	assignee?: string;
	/** A `proposal` entry: the agent's ask, drawn as an InboxCard while it waits. */
	proposal?: InboxItem;
};

export type InboxThread = {
	/** `type:id`, unique across subjects. */
	key: string;
	subject: InboxSubject;
	/** Oldest first. */
	entries: InboxEntry[];
	unread: number;
	/** The newest valid timestamp, as written. The raw first one when none parses. */
	latestAt: string;
	/** Proposals still waiting for a verdict, newest first. */
	pending: InboxEntry[];
};

export type InboxFilter = {
	/** A subject type, or "all". */
	type: string;
	/** An actor name, or "all". */
	who: string;
	/** Only threads holding a pending proposal. */
	needsYou: boolean;
};

export const ALL = "all";

export type InboxKey = "next" | "previous" | "toggleRead" | "snooze" | "approve" | "decline" | "steer" | "edit";

export type InboxSnooze = { thread: InboxThread; until: Date };

export type InboxLabels = {
	title: string;
	all: string;
	anyone: string;
	needsYou: string;
	empty: string;
	emptyNeedsYou: string;
	emptyFiltered: string;
	clearFilters: string;
	unread: string;
	markRead: string;
	markUnread: string;
	snooze: string;
	snoozeLater: string;
	snoozeTomorrow: string;
	snoozeNextWeek: string;
	selectThread: string;
	filterType: string;
	filterWho: string;
	agent: string;
	statusMoved: string;
	statusSet: string;
	assigned: string;
	mentioned: string;
	commented: string;
	responded: string;
	proposed: string;
	/** Keyboard hint words. */
	hintMove: string;
	hintRead: string;
	hintSnooze: string;
	hintAct: string;
};

export const DEFAULT_INBOX_LABELS: InboxLabels = {
	title: "Inbox",
	all: "All",
	anyone: "Anyone",
	needsYou: "Needs you",
	empty: "Nothing here",
	emptyNeedsYou: "Nothing is waiting on you",
	emptyFiltered: "No thread matches these filters",
	clearFilters: "Clear filters",
	unread: "unread",
	markRead: "Mark read",
	markUnread: "Mark unread",
	snooze: "Snooze",
	snoozeLater: "Later today",
	snoozeTomorrow: "Tomorrow",
	snoozeNextWeek: "Next week",
	selectThread: "Select a thread",
	filterType: "Filter by type",
	filterWho: "Filter by person or agent",
	agent: "AI",
	statusMoved: "moved this from {from} to {to}",
	statusSet: "set this to {to}",
	assigned: "assigned this to {assignee}",
	mentioned: "mentioned you",
	commented: "commented",
	responded: "replied",
	proposed: "asks for your call",
	hintMove: "move",
	hintRead: "read",
	hintSnooze: "snooze",
	hintAct: "approve, decline, steer, edit",
};
