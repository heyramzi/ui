<script lang="ts">
	import { STAGES, STAGE_ORDER, stageOf, type Stage } from "#src/core/notes.js";
	import { clockToSeconds } from "#src/core/format.js";
	import type { Note } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Compose from "#src/ui/Compose.svelte";
	import Empty from "#src/ui/Empty.svelte";
	import NoteCard from "#src/ui/NoteCard.svelte";
	import Segmented from "#src/ui/Segmented.svelte";

	const app = useApp();
	const model = $derived(app.review.model);
	let now = $state(Date.now());
	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});

	const at = (note: Note): number => {
		const t = note.target;
		if (note.orphaned) return Number.POSITIVE_INFINITY;
		if (t.kind === "video") return -1;
		if (t.kind === "time") return t.at;
		if (t.kind === "text") return clockToSeconds(t.from);
		return model?.beats.find((beat) => beat.id === t.beat)?.seconds ?? 0;
	};
	const list = $derived(
		app.notes.filter((note) => stageOf(note) === app.stage).toSorted((a, b) => at(a) - at(b)),
	);
	const items = $derived(
		STAGE_ORDER.map((id) => ({ id, label: STAGES[id].label, count: app.counts[id], mark: id })),
	);
	$effect(() => {
		const offs = ["accept", "dismiss", "tick"].map((act) =>
			app.keys.bind({
				id: `note.${act}`,
				keys: [act === "accept" ? "a" : act === "dismiss" ? "x" : "t"],
				label:
					act === "accept"
						? "Accept the suggestion"
						: act === "dismiss"
							? "Ignore the suggestion"
							: "Mark the answer done",
				group: "Notes",
				enabled: () => !!app.activeNote,
				run: () => {
					const note = model?.notes.find((item) => item.id === app.activeNote);
					if (!note) return false;
					const ok = act === "tick" ? note.status === "answered" : note.status === "proposal";
					if (!ok) return false;
					app.review.act({
						type: "note.act",
						note: note.id,
						act: act as "accept" | "dismiss" | "tick",
					});
				},
			}),
		);
		return () => offs.forEach((off) => off());
	});
</script>

<aside class="panel" aria-label="Feedback">
	<div class="top">
		<Segmented
			{items}
			value={app.stage}
			label="Note status"
			onchange={(id: Stage) => (app.stage = id)}
		/>
	</div>

	<div class="list" role="tabpanel">
		{#each list as note (note.id)}<NoteCard {note} {now} />{:else}
			<Empty icon="note" title={STAGES[app.stage].empty} />
		{/each}
	</div>
	<Compose />
</aside>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		background: var(--surface);
	}
	.top {
		display: grid;
		gap: 6px;
		padding: 10px 12px;
		border-bottom: 1px solid var(--line-soft);
	}
	.list {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2px;
		min-height: 0;
		padding: 8px;
		overflow-y: auto;
	}
</style>
