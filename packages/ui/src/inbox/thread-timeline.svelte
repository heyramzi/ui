<script lang="ts">
	import type { Snippet } from "svelte";
	import { ArrowRight, Circle, Sparkle, UserPlus } from "phosphor-svelte";
	import { AgentAvatar } from "#src/agents/index.js";
	import DetailPanel from "#src/components/list-page/detail-panel.svelte";
	import { initial } from "#src/lib/initials.js";
	import EntryBody from "#src/inbox/entry-body.svelte";
	import { entryLine, sentenceOf, timelineOf } from "#src/inbox/logic.js";
	import type { InboxActor, InboxEntry, InboxLabels } from "#src/inbox/types.js";

	interface Props {
		/** The thread's entries, oldest first, without the pinned proposals. */
		entries: InboxEntry[];
		labels: InboxLabels;
		when: (at: string) => string;
		avatar?: Snippet<[InboxActor]>;
		attachments?: Snippet<[InboxEntry]>;
	}

	let { entries, labels, when, avatar, attachments }: Props = $props();

	let timeline = $derived(timelineOf(entries));

	/** The full date and time, for the hover title. */
	function full(at: string): string {
		const date = new Date(at);
		return Number.isNaN(date.getTime())
			? ""
			: date.toLocaleString(undefined, {
					month: "short",
					day: "numeric",
					hour: "numeric",
					minute: "2-digit",
				});
	}
</script>

{#snippet face(actor: InboxActor)}
	<span class="relative size-6 shrink-0">
		{#if avatar}
			{@render avatar(actor)}
		{:else if actor.kind === "agent"}
			<AgentAvatar name={actor.name} size={24} paused interactive={false} />
		{:else if actor.avatar}
			<img src={actor.avatar} alt="" class="size-6 rounded-full object-cover" />
		{:else}
			<span
				class="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
				aria-hidden="true"
			>
				{initial(actor.name)}
			</span>
		{/if}
	</span>
{/snippet}

{#if timeline.length > 0}
	<DetailPanel>
		<ol class="flex flex-col gap-4">
			{#each timeline as block (block.key)}
				{#if block.type === "message"}
					{@const entry = block.entry}
					<li class="flex gap-3">
						{@render face(entry.actor)}
						<div class="min-w-0 flex-1">
							<div class="flex min-h-6 flex-wrap items-center gap-x-2 text-[13px]">
								<span class="truncate font-medium">{entry.actor.name}</span>
								{#if entry.actor.kind === "agent"}<span class="sr-only">{labels.agent}</span>{/if}
								{#if entry.kind === "mention"}
									<span class="text-muted-foreground">{entryLine(entry, labels)}</span>
								{/if}
								<time
									class="text-xs text-muted-foreground tabular-nums"
									datetime={entry.at}
									title={full(entry.at)}>{when(entry.at)}</time
								>
								{#if !entry.read}
									<Circle weight="fill" class="size-1.5 text-primary" aria-label={labels.unread} />
								{/if}
							</div>
							{#if entry.body}
								<EntryBody text={entry.body} more={labels.showMore} less={labels.showLess} />
							{/if}
							{@render attachments?.(entry)}
						</div>
					</li>
				{:else}
					<li class="flex flex-col gap-1">
						{#each block.entries as entry, i (entry.id)}
							<div class="flex items-start gap-2 text-xs text-muted-foreground">
								<span class="grid size-6 shrink-0 place-items-center" aria-hidden="true">
									{#if entry.kind === "status"}
										<ArrowRight size={14} />
									{:else if entry.kind === "assigned"}
										<UserPlus size={14} />
									{:else}
										<Sparkle size={14} />
									{/if}
								</span>
								<!-- Wraps, not truncates: a status name can be a sentence, and a touch screen has no hover title. -->
								<p class="min-w-0 flex-1 py-1 text-pretty [overflow-wrap:anywhere]">
									{i === 0 || !entry.actor.name
										? sentenceOf(entry, labels)
										: entryLine(entry, labels)}
								</p>
								<time class="shrink-0 py-1 tabular-nums" datetime={entry.at} title={full(entry.at)}
									>{when(entry.at)}</time
								>
							</div>
						{/each}
					</li>
				{/if}
			{/each}
		</ol>
	</DetailPanel>
{/if}
