<script lang="ts">
	import { ago } from "#src/core/format.js";
	import { isPending, verbsFor } from "#src/core/notes.js";
	import type { Note, NoteStatus } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import { kindOf, pickedOption } from "#src/core/beats.js";
	import { createPicker } from "#src/hooks/picker.svelte.js";
	import { AgentAvatar } from "@heyramzi/ui/agents";
	import Kbd from "#src/ui/Kbd.svelte";
	import RefMenu from "#src/ui/RefMenu.svelte";
	import RichText from "#src/ui/RichText.svelte";
	import Swap from "#src/ui/Swap.svelte";
	import Preview from "#src/ui/Preview.svelte";
	import TargetChip from "#src/ui/TargetChip.svelte";

	let { note, now }: { note: Note; now: number } = $props();
	const app = useApp();

	/** Says where the note is in plain words, so "answered" never leaves you guessing. */
	const STATUS: Record<NoteStatus, string> = {
		open: "With the agent",
		queued: "Waiting",
		working: "The agent is on it",
		answered: "Ready for you",
		done: "Done",
		proposal: "The agent suggests",
		dismissed: "Dismissed",
	};

	const active = $derived(app.activeNote === note.id);
	const pending = $derived(isPending(note));
	// A check clears itself when it passes, so there is nothing to accept, reply to or delete.
	const verbs = $derived(pending || note.check ? [] : verbsFor(note.status));
	// WHY: a card that waits on the user shows its whole ask and its buttons without a click, or it can't be decided from the list.
	const deciding = $derived(
		verbs.length > 0 && (note.status === "proposal" || note.status === "answered"),
	);
	// The tab already says "Needs you" or "Done", so repeating it on every card adds nothing.
	const showStatus = $derived(
		pending ||
			!(
				(note.status === "answered" && app.stage === "needs") ||
				(note.status === "done" && app.stage === "done")
			),
	);
	// A suggestion or an answer comes from the agent by default, and its status already says so.
	const agentTag = $derived(
		note.by === "agent" && note.status !== "proposal" && note.status !== "answered",
	);
	const thinking = $derived(
		note.status === "working" || note.status === "queued" || Boolean(note.working),
	);
	const beat = $derived(
		note.target.kind === "beat"
			? app.review.model?.beats.find((item) => item.id === (note.target as { beat: string }).beat)
			: undefined,
	);
	/** The word whisper doubted, when the note is the first cut's caption check. */
	const doubted = $derived(/^caption check: whisper was unsure of "(.+)"$/.exec(note.text)?.[1]);
	const captionCheck = $derived(doubted !== undefined);
	const canReply = $derived(
		(note.status === "answered" || note.status === "proposal") && !pending && !note.check,
	);
	const picker = createPicker(app.library);
	let reply = $state("");
	let showThread = $state(false);

	function run(act: (typeof verbs)[number]["act"]) {
		app.review.act({ type: "note.act", note: note.id, act });
	}
	function sendReply() {
		const text = reply.trim();
		if (!text) return;
		app.review.act({ type: "note.reply", note: note.id, text });
		reply = "";
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<article
	class="note"
	class:active
	class:pending
	class:deciding
	class:orphaned={note.orphaned}
	class:settled={note.status === "done" || note.status === "dismissed"}
	data-note={note.id}
	data-status={note.status}
	tabindex="0"
	aria-label="Note {note.id}"
	onclick={() => app.reveal(note)}
	onkeydown={(e) =>
		e.target === e.currentTarget &&
		(e.key === "Enter" || e.key === " ") &&
		(e.preventDefault(), app.reveal(note))}
>
	<header>
		<TargetChip target={note.target} />
		{#if note.check}<span class="tag">Automatic check</span>{:else if captionCheck}<span class="tag"
				>Caption</span
			>{:else if agentTag}<span class="tag">From your agent</span>{/if}
		{#if note.orphaned}<span class="cut" data-tip="That moment was cut.">Line cut</span>{/if}
		{#if showStatus}<span class="status s-{note.status}"
				><i></i><Swap value={pending ? "Sending" : STATUS[note.status]} /></span
			>{/if}
	</header>

	{#if active && beat}
		<div class="ctx">
			<div class="thumb">
				<Preview
					option={pickedOption(beat)}
					pending={beat.pending}
					kind={app.review.model ? kindOf(app.review.model, beat.kind) : undefined}
				/>
			</div>
			<span class="quote">{beat.line}</span>
		</div>
	{/if}

	<p class="text">
		{#if doubted}Is <q>{doubted.replace(/[,.]$/, "")}</q> spelled right?{:else}<RichText
				text={note.text}
			/>{/if}
	</p>

	{#if active && note.check?.png}
		<img class="strip" src={note.check.png} alt="The sound and words around this cut" />
	{/if}

	{#if note.working}
		<div class="said working">
			<span class="face"><AgentAvatar name="Agent" state="working" /></span>
			<p>
				<span>{note.working.text}</span>
				<time>{ago(note.working.at, now)}</time>
			</p>
		</div>
	{/if}

	{#if active && note.thread?.length}
		<button
			class="thread-toggle"
			aria-expanded={showThread}
			onclick={(e) => {
				e.stopPropagation();
				showThread = !showThread;
			}}
		>
			<Icon name="chevron" small />{showThread ? "Hide" : "Show"}
			{note.thread.length} earlier {note.thread.length === 1 ? "reply" : "replies"}
		</button>
		{#if showThread}
			<ul class="thread">
				{#each note.thread as turn, i (i)}<li class="by-{turn.by}">
						<b>{turn.by === "agent" ? "Agent" : "You"}</b>
						<RichText text={turn.text} />
					</li>{/each}
			</ul>
		{/if}
	{/if}

	{#if note.reply && !thinking}
		<div class="said" class:clamp={!active && !deciding}>
			<span class="face"><AgentAvatar name="Agent" /></span>
			<p><span><RichText text={note.reply} /></span></p>
		</div>
	{/if}

	{#if deciding || (active && (verbs.length || canReply))}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
		<footer onclick={(e) => e.stopPropagation()}>
			{#if verbs.length}
				<div class="acts">
					{#each verbs as verb, i (verb.act)}
						<button
							class="btn {active && i === 0 && verb.primary ? 'primary' : 'quiet'}"
							onclick={() => run(verb.act)}
						>
							<Icon name={verb.icon} small />{verb.label}{#if verb.key && active}<Kbd
									combo={verb.key}
								/>{/if}
						</button>
					{/each}
				</div>
			{/if}
			{#if canReply && active}
				<form
					class="field"
					onsubmit={(e) => {
						e.preventDefault();
						sendReply();
					}}
				>
					<input
						bind:value={reply}
						placeholder={captionCheck
							? "Type the correct word or phrase"
							: note.status === "proposal"
								? "Add a comment to this suggestion"
								: "Not quite? Say what's off"}
						aria-label={captionCheck ? `Correct caption ${note.id}` : `Reply to note ${note.id}`}
						{...picker.attrs}
						oninput={(e) => picker.sync(e.currentTarget)}
						onclick={(e) => picker.sync(e.currentTarget)}
						onblur={() => picker.close()}
						onkeydown={(e) => picker.keydown(e)}
					/>
					<RefMenu {picker} />
					<button
						class="btn icon send"
						aria-label={captionCheck ? "Save caption correction" : "Send reply"}
						disabled={!reply.trim()}><Icon name="send" small /></button
					>
				</form>
			{/if}
		</footer>
	{/if}
</article>

<style>
	/* A row in a list, as the old Shorts sidebar had it: no box, the selected one opens in place. */
	.note {
		position: relative;
		display: grid;
		gap: 8px;
		padding: 12px 12px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		outline-offset: -2px;
		animation: rv-swap var(--duration-fast) var(--ease-in-out) both;
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			box-shadow var(--duration-quick) var(--ease-smooth-out),
			opacity var(--duration-fast) var(--ease-smooth-out);
	}
	/* A hairline between rows, so a long list reads as one list instead of floating blocks. */
	.note + :global(.note)::before {
		content: "";
		position: absolute;
		inset: 0 12px auto;
		border-top: 1px solid var(--line-soft);
	}
	@media (hover: hover) and (pointer: fine) {
		.note:hover {
			background: var(--hover);
		}
	}
	.note.active::before,
	:global(.note.active) + .note::before {
		border-color: transparent;
	}
	@media (hover: hover) and (pointer: fine) {
		.note:hover::before,
		:global(.note:hover) + .note::before {
			border-color: transparent;
		}
	}
	.note.active {
		background: var(--surface);
		box-shadow:
			inset 0 0 0 1px var(--line),
			var(--shadow-lift);
		cursor: default;
	}
	.note.pending {
		opacity: 0.6;
	}
	.note.settled:not(.active) .text {
		color: var(--dim);
	}
	header {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}
	header :global(.chip) {
		background: transparent;
		padding-left: 0;
	}
	.cut {
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.strip {
		display: block;
		width: 100%;
		border-radius: var(--radius-sm);
		box-shadow: 0 0 0 1px var(--line);
		background: var(--ground);
	}
	.tag {
		flex: none;
		padding: 1px 7px;
		border-radius: var(--radius-pill);
		background: var(--hover);
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
	}
	.text q {
		font-weight: 600;
		quotes: "\201C" "\201D";
	}
	.status {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 6px;
		margin-left: auto;
		color: var(--faint);
		font-size: var(--fs-xs);
		font-weight: 500;
	}
	.status i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}
	.s-open,
	.s-queued,
	.s-working {
		color: var(--accent);
	}
	.s-working i,
	.s-queued i {
		animation: rv-pulse var(--pulse-dur) var(--ease-in-out) infinite alternate;
	}
	.s-answered {
		color: var(--ok);
	}
	.s-proposal {
		color: var(--bot);
	}
	.ctx {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		color: var(--dim);
		font-size: var(--fs-xs);
		animation: open-in var(--duration-fast) var(--ease-smooth-out) both;
	}
	.thumb {
		flex: none;
		width: 64px;
		overflow: hidden;
		border-radius: var(--radius-sm);
		pointer-events: none;
	}
	.thumb :global(.disc),
	.thumb :global(.clock),
	.thumb :global(.bar) {
		display: none;
	}
	.quote {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		font-style: italic;
	}
	.text {
		font-size: var(--fs-sm);
		line-height: 1.5;
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.note:not(.active, .deciding) .text {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	/* The avatar fills 75% of its slot, which leaves its idle jump room so it never clips. */
	.face {
		display: block;
		flex: none;
		width: 26px;
		aspect-ratio: 1;
		margin: -3px 0 0 -3px;
	}
	/* The agent's answer: its one face, then what it said, in the same voice as a chat reply. */
	.said {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 7px;
		align-items: start;
		padding: 8px 10px 8px 8px;
		border-radius: var(--radius-sm);
		background: color-mix(in oklab, var(--bot) 7%, transparent);
		animation: open-in var(--duration-medium) var(--ease-smooth-out) both;
	}
	.said p {
		display: grid;
		gap: 2px;
		min-width: 0;
		color: var(--text);
		font-size: var(--fs-xs);
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
	.said.clamp span {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	.working time {
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	@keyframes open-in {
		from {
			opacity: 0;
			transform: translateY(var(--distance-micro));
			filter: blur(var(--blur-small));
		}
	}
	.thread-toggle {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		justify-self: start;
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	.thread-toggle[aria-expanded="true"] :global(.ic) {
		rotate: 90deg;
	}
	@media (hover: hover) and (pointer: fine) {
		.thread-toggle:hover {
			color: var(--text);
		}
	}
	.thread {
		display: grid;
		gap: 4px;
		margin-left: 9px;
		padding-left: 10px;
		border-left: 1px solid var(--line);
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	.thread b {
		color: var(--text);
		font-weight: 600;
	}
	footer {
		display: grid;
		gap: 8px;
		margin-top: 3px;
		padding-top: 10px;
		border-top: 1px solid var(--line-soft);
		animation: open-in var(--duration-fast) var(--ease-smooth-out) both;
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.acts :global(kbd) {
		background: transparent;
		color: inherit;
		opacity: 0.75;
	}
	/* The field wears the border so the send button sits inside it, like a chat composer. */
	.field {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
		padding: 2px 2px 2px 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--ground);
		cursor: text;
		transition: border-color var(--duration-quick) var(--ease-smooth-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.field:hover {
			border-color: var(--line-strong);
		}
	}
	.field:focus-within {
		border-color: var(--accent-line);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	.field input {
		flex: 1;
		min-width: 0;
		min-height: calc(var(--control) - 6px);
		padding: 0 10px;
		border: 0;
		background: transparent;
		font-size: var(--fs-xs);
	}
	.field input::placeholder {
		color: var(--faint);
	}
	.field input:focus,
	.field input:focus-visible {
		outline: none;
	}
	.send {
		flex: none;
		width: calc(var(--control) - 6px);
		min-height: calc(var(--control) - 6px);
		padding: 0;
		color: var(--accent);
	}
	.send:disabled {
		color: var(--faint);
	}
</style>
