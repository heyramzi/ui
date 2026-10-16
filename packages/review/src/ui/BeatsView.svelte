<script lang="ts">
	import { tick } from "svelte";
	import {
		BEAT_FILTERS,
		beatsOf,
		isOpenBeat,
		matchesFilter,
		nextOpen,
		type BeatFilter,
	} from "#src/core/beats.js";
	import type { Beat, Pass } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import BeatCard from "#src/ui/BeatCard.svelte";
	import Empty from "#src/ui/Empty.svelte";
	import PassHead from "#src/ui/PassHead.svelte";
	import Segmented from "#src/ui/Segmented.svelte";

	let { pass }: { pass: Pass } = $props();
	const app = useApp();
	const model = $derived(app.review.model);
	const all = $derived(model ? beatsOf(model, pass) : []);
	let filter = $state<BeatFilter>("todo");
	const shown = $derived(all.filter((beat) => matchesFilter(beat, filter)));
	const items = $derived(
		BEAT_FILTERS.map((f) => ({
			...f,
			count: all.filter((beat) => matchesFilter(beat, f.id)).length,
			mark: f.id,
		})),
	);

	// WHY: land on the first thing left to decide, and heal the focus when its beat leaves the list.
	$effect(() => {
		if (shown.some((beat) => beat.id === app.beatId)) return;
		app.beatId = (shown.find(isOpenBeat) ?? shown[0])?.id;
	});

	async function focusBeat(id: string | undefined) {
		if (!id) return;
		app.beatId = id;
		await tick();
		const card = app.root?.querySelector<HTMLElement>(`[data-beat="${CSS.escape(id)}"]`);
		card?.scrollIntoView({
			block: "center",
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
		});
	}

	function move(delta: number) {
		const at = shown.findIndex((beat) => beat.id === app.beatId);
		void focusBeat(shown[Math.min(Math.max(at + delta, 0), shown.length - 1)]?.id);
	}

	/** After Keep or Skip, on to the next beat that still needs a decision. */
	function advance(done: Beat) {
		const next = nextOpen(shown, done.id);
		if (next && next.id !== done.id) void focusBeat(next.id);
	}

	const current = () => shown.find((beat) => beat.id === app.beatId);
	function decide(state: "approved" | "skipped" | "proposed") {
		const beat = current();
		if (!beat || (state === "approved" && beat.orphaned)) return;
		const pick = beat.pick ?? beat.options[0]?.id;
		app.review.act({ type: "decide", beat: beat.id, state, ...(pick ? { pick } : {}) });
		if (state !== "proposed") advance(beat);
	}

	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "beat.next",
				keys: ["j"],
				label: "Next change",
				group: "Changes",
				run: () => move(1),
			}),
			app.keys.bind({
				id: "beat.prev",
				keys: ["k"],
				label: "Previous change",
				group: "Changes",
				run: () => move(-1),
			}),
			app.keys.bind({
				id: "beat.keep",
				keys: ["y"],
				label: "Keep",
				group: "Changes",
				run: () => decide("approved"),
			}),
			app.keys.bind({
				id: "beat.skip",
				keys: ["n"],
				label: "Skip",
				group: "Changes",
				run: () => decide("skipped"),
			}),
			app.keys.bind({
				id: "beat.undo",
				keys: ["u"],
				label: "Undo the decision",
				group: "Changes",
				run: () => decide("proposed"),
			}),
		];
		return () => offs.forEach((off) => off());
	});
</script>

<section class="beats" data-view="beats">
	<PassHead {pass}>
		{#if all.length > 0}
			<div class="filters">
				<Segmented
					{items}
					value={filter}
					label="Filter changes"
					onchange={(id) => (filter = id)}
					--seg-bar="var(--surface)"
				/>
			</div>
		{/if}
	</PassHead>
	{#if all.length === 0}
		<Empty
			icon="video"
			title="Nothing to decide here"
			hint="Changes show up when your agent has something to suggest."
		/>
	{:else}
		{#if shown.length === 0}
			<Empty
				icon="check"
				title={filter === "todo"
					? "All decided"
					: `No ${filter === "kept" ? "kept" : "skipped"} changes`}
			/>
		{:else}
			<div class="stack">
				{#each shown as beat (beat.id)}
					<BeatCard
						{beat}
						hideState={filter === "todo" ? "proposed" : filter === "kept" ? "approved" : "skipped"}
						afterDecide={advance}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</section>

<style>
	.beats {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 920px;
		margin: 0 auto;
		padding: 20px var(--gutter) 64px;
	}
	.filters {
		flex: 0 1 380px;
		min-width: 0;
	}
	.filters :global(.seg) {
		width: 100%;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
