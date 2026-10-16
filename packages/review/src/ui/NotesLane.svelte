<script lang="ts">
	import { clock } from "#src/core/format.js";
	import { isSettled } from "#src/core/notes.js";
	import type { Note } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";

	let { duration }: { duration: number } = $props();
	const app = useApp();
	type Timed = Note & { target: { kind: "time"; at: number; span?: number } };

	// A note whose moment was cut out has no place on the cut, so it stays in the panel only.
	const notes = $derived(
		(app.review.model?.notes ?? []).filter(
			(note): note is Timed => note.target.kind === "time" && !isSettled(note) && !note.orphaned,
		),
	);
	const pct = (seconds: number) =>
		duration ? Math.min(Math.max(seconds / duration, 0), 1) * 100 : 0;
	const tone = (note: Note) =>
		note.by === "agent" ? "bot" : note.status === "answered" ? "ok" : "warn";
</script>

{#each notes as note (note.id)}
	{@const end = note.target.span ? pct(note.target.at + note.target.span) : pct(note.target.at)}
	<button
		class="npin tone-{tone(note)}"
		class:active={app.activeNote === note.id}
		class:span={!!note.target.span}
		data-note-pin={note.id}
		data-say="{clock(note.target.at)}  {note.text}"
		style:left="{pct(note.target.at)}%"
		style:width={note.target.span ? `${Math.max(end - pct(note.target.at), 0.8)}%` : undefined}
		aria-label="Note at {clock(note.target.at)}: {note.text}"
		onpointerdown={(e) => e.stopPropagation()}
		onclick={() => {
			app.reveal(note);
			app.panels.showPanel();
		}}
	></button>
{/each}

<style>
	.npin {
		position: absolute;
		z-index: 4;
		top: 3px;
		bottom: 3px;
		width: 8px;
		margin-left: -4px;
		border-radius: var(--radius-xs);
		background: var(--tone);
		transition:
			scale var(--duration-quick) var(--ease-out-quart),
			background-color var(--duration-quick) var(--ease-smooth-out);
	}
	/* A pin is 8px wide, so its hit area grows to the 24px floor without moving it. */
	.npin::before {
		content: "";
		position: absolute;
		inset: -3px calc((8px - 24px) / 2);
	}
	.npin.span::before {
		inset: -3px 0;
	}
	.npin.span {
		width: auto;
		margin-left: 0;
		background: color-mix(in oklab, var(--tone) 70%, transparent);
		box-shadow: inset 2px 0 0 var(--tone);
	}
	.npin:hover,
	.npin.active {
		scale: 1.2;
		background: var(--accent);
	}
	.npin:active {
		scale: var(--scale-large);
	}
</style>
