<script lang="ts">
	import {
		ThreadInbox,
		type InboxEntry,
		type InboxItem,
		type InboxSubject,
	} from "@heyramzi/ui/inbox";
	import { StatusBadge, defineStatuses } from "@heyramzi/ui/status";

	const statuses = defineStatuses({
		todo: { label: "To do", tone: "neutral", variant: "open" },
		review: { label: "In review", tone: "warning", variant: "progress", progress: 0.7 },
		done: { label: "Done", tone: "success", variant: "completed" },
	});

	const task7: InboxSubject = {
		type: "task",
		id: "7",
		ref: "TSK-7",
		title: "Write the pricing page",
		status: "review",
	};
	const task9: InboxSubject = {
		type: "task",
		id: "9",
		ref: "TSK-9",
		title: "Fix the footer links",
		status: "todo",
	};
	const task12: InboxSubject = {
		type: "task",
		id: "12",
		ref: "TSK-12",
		title: "Send the Northwind quote",
		status: "todo",
	};
	const brief: InboxSubject = { type: "doc", id: "brief", title: "Launch brief", status: "done" };

	const ada = { kind: "user", name: "Ada Okafor" } as const;
	const scribe = { kind: "agent", name: "Scribe" } as const;
	const quote = { kind: "agent", name: "Quote agent" } as const;

	const ask: InboxItem = {
		id: "ask-12",
		kind: "decision",
		tier: "ask",
		state: "proposed",
		title: "Send the Northwind quote",
		project: { id: "northwind", name: "Contract workflow" },
		proposal: { summary: "Quote 14 templates at the mid tier, valid for 30 days." },
		confidence: { score: 0.72, missing: "They never confirmed the office count." },
		trace: {
			source: { type: "email", label: "Reply from Northwind Legal", at: "Thu 08:15" },
			evidence: [{ quote: "Three offices, maybe four.", by: "Dana" }],
			reasoning: "Scope matches the mid tier unless a fourth office joins.",
		},
		agent: { name: "Quote agent" },
	};

	let entries = $state<InboxEntry[]>([
		{
			id: "e1",
			kind: "agent_response",
			subject: task7,
			actor: scribe,
			at: "2026-10-22T09:00:00Z",
			body: "Drafted the three plan cards. Waiting on your read.",
		},
		{
			id: "e2",
			kind: "status",
			subject: task7,
			actor: scribe,
			at: "2026-10-22T09:05:00Z",
			status: { from: "To do", to: "In review" },
		},
		{
			id: "e3",
			kind: "mention",
			subject: task9,
			actor: ada,
			at: "2026-10-22T07:30:00Z",
			body: "Can you check the footer before the 10:00 send?",
			read: true,
		},
		{
			id: "e4",
			kind: "comment",
			subject: brief,
			actor: ada,
			at: "2026-10-21T15:00:00Z",
			body: "Moved the launch date to the 3rd.",
			read: true,
		},
		{
			id: "e5",
			kind: "proposal",
			subject: task12,
			actor: quote,
			at: "2026-10-22T08:20:00Z",
			proposal: ask,
		},
	]);

	let selected = $state<string>();

	function markThread(key: string, read: boolean) {
		entries = entries.map((entry) =>
			entry.subject && `${entry.subject.type}:${entry.subject.id}` === key
				? { ...entry, read }
				: entry,
		);
	}
</script>

<ThreadInbox
	{entries}
	bind:selected
	unreadFirst
	typeLabels={{ task: "Tasks", doc: "Docs" }}
	onRead={(thread, read) => markThread(thread.key, read)}
	onSnooze={({ thread }) =>
		(entries = entries.filter(
			(entry) => `${entry.subject?.type}:${entry.subject?.id}` !== thread.key,
		))}
	onDecide={(verdict) =>
		(entries = entries.map((entry) =>
			entry.proposal?.id === verdict.id && entry.proposal
				? {
						...entry,
						proposal: {
							...entry.proposal,
							state:
								verdict.type === "approve"
									? "approved"
									: verdict.type === "decline"
										? "declined"
										: "working",
						},
					}
				: entry,
		))}
>
	{#snippet status(subject)}
		{#if subject.status && statuses.has(subject.status)}
			<StatusBadge {statuses} status={subject.status} />
		{/if}
	{/snippet}
</ThreadInbox>
