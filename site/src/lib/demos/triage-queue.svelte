<script lang="ts">
	import { TriagePlan, TriageQueue, TriageTask } from "@heyramzi/ui/triage";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Tray } from "phosphor-svelte";

	type Mail = {
		id: string;
		from: string;
		subject: string;
		snippet: string;
		received: string;
		plan: string | null;
		reason?: string;
	};

	let waiting = $state<Mail[]>([
		{
			id: "1",
			from: "Priya Nair",
			subject: "Logo files for the spring launch",
			snippet:
				"Attached are the final SVGs. Can you check they work on the dark footer before Friday?",
			received: "Oct 26, 9:14 AM",
			plan: "Create a task in Clients / Launch",
		},
		{
			id: "2",
			from: "Tomas Berg",
			subject: "Re: invoice 118",
			snippet: "We paid it on the 20th, the receipt is below.",
			received: "Oct 26, 8:02 AM",
			plan: "Comment on Invoice 118 reminder",
			reason: "Two open tasks mention this invoice.",
		},
		{
			id: "3",
			from: "Out of office",
			subject: "Automatic reply: Kickoff call",
			snippet: "I'm away until Monday.",
			received: "Oct 25, 6:40 PM",
			plan: null,
		},
	]);

	let settled = $state([
		{
			id: "a",
			from: "Priya Nair",
			subject: "Kickoff notes",
			outcome: { label: "Task created", tone: "success" as const },
			task: { name: "Send kickoff notes to Priya", url: "https://app.clickup.com" },
			when: "Oct 25, 4:12 PM",
			undoable: true,
		},
		{
			id: "b",
			from: "Tomas Berg",
			subject: "Quarterly check-in",
			outcome: { label: "Failed", tone: "destructive" as const },
			task: null,
			when: "Oct 25, 11:30 AM",
			detail: "ClickUp refused the list. Reconnect and try again.",
			undoable: false,
		},
		{
			id: "c",
			from: "Newsletter",
			subject: "Ten tips for inbox zero",
			outcome: { label: "Dismissed", tone: "neutral" as const },
			task: null,
			when: "Oct 24, 9:05 AM",
			undoable: false,
		},
	]);

	let tab = $state<"review" | "done">("review");
	let empty = $state(false);
	let items = $derived(empty ? [] : waiting);

	const wait = () => new Promise((resolve) => setTimeout(resolve, 500));
	const drop = (id: string) => (waiting = waiting.filter((mail) => mail.id !== id));
</script>

<div class="w-full max-w-2xl">
	<div class="border-border mb-4 flex items-center gap-1 border-b">
		{#each [{ key: "review", label: "Needs review" }, { key: "done", label: "Done" }] as const as t (t.key)}
			<button
				type="button"
				aria-pressed={tab === t.key}
				class="-mb-px border-b-2 px-3 py-2 text-sm font-medium {tab === t.key
					? 'border-primary text-foreground'
					: 'text-muted-foreground hover:text-foreground border-transparent'}"
				onclick={() => (tab = t.key)}
			>
				{t.label}
			</button>
		{/each}
		<Button class="ms-auto" size="sm" variant="ghost" onclick={() => (empty = !empty)}>
			{empty ? "Show mail" : "Show empty"}
		</Button>
	</div>

	{#if tab === "review"}
		<TriageQueue {items} key={(mail) => mail.id} empty="Nothing waiting for you.">
			{#snippet icon()}<Tray aria-hidden="true" class="size-6" />{/snippet}
			{#snippet row(mail)}
				<TriagePlan
					sender={mail.from}
					subject={mail.subject}
					snippet={mail.snippet}
					received={mail.received}
					plan={mail.plan}
					reason={mail.reason}
					onApprove={async () => {
						await wait();
						drop(mail.id);
					}}
					onPick={async () => {
						await wait();
						drop(mail.id);
					}}
					onDismiss={async () => {
						await wait();
						drop(mail.id);
					}}
				/>
			{/snippet}
		</TriageQueue>
	{:else}
		<TriageQueue
			kind="tasks"
			items={empty ? [] : settled}
			key={(row) => row.id}
			empty="Nothing settled yet."
		>
			{#snippet icon()}<Tray aria-hidden="true" class="size-6" />{/snippet}
			{#snippet row(entry)}
				<TriageTask
					sender={entry.from}
					subject={entry.subject}
					outcome={entry.outcome}
					task={entry.task}
					when={entry.when}
					detail={entry.detail}
					onUndo={entry.undoable
						? async () => {
								await wait();
								settled = settled.filter((r) => r.id !== entry.id);
							}
						: undefined}
				/>
			{/snippet}
		</TriageQueue>
	{/if}
</div>
