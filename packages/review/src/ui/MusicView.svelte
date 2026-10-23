<script lang="ts">
	import { clock } from "#src/core/format.js";
	import type { Pass, ReviewAction } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Empty from "#src/ui/Empty.svelte";
	import Icon from "#src/components/icons/Icon.svelte";
	import PassHead from "#src/ui/PassHead.svelte";
	import { claim } from "#src/ui/media.js";

	let { pass }: { pass: Pass } = $props();
	const app = useApp();
	const music = $derived(app.review.model?.music);
	// "More" is only answered by a connected agent, so the page says whether one is on it.
	const WAIT = {
		listening: "Your agent is finding tracks.",
		idle: "No agent is connected, so nobody is looking yet. Connect one from the agent dock.",
		offline: "Editor OS is offline. The request waits here.",
	} as const;
	const wait = $derived(WAIT[app.review.session]);

	let audio = $state<HTMLAudioElement>();
	let playing = $state<string | undefined>();
	let time = $state(0);

	function play(id: string, src: string | undefined) {
		if (!audio || !src) return;
		if (playing === id) {
			audio.pause();
			return;
		}
		audio.src = src;
		claim(audio);
		void audio
			.play()
			.then(() => (playing = id))
			.catch(() => (playing = undefined));
	}

	// Picking a bed (or no music) is the decision, so the preview stops there.
	function decide(action: ReviewAction) {
		audio?.pause();
		app.review.act(action);
	}
</script>

<section class="music" data-view="music">
	<PassHead {pass}>
		{#if music}
			<button
				class="btn solid"
				aria-pressed={music.decision === "skipped"}
				onclick={() => music.decision !== "skipped" && decide({ type: "music", skip: true })}
				>No music</button
			>
		{/if}
	</PassHead>

	<!-- svelte-ignore a11y_media_has_caption -->
	<audio
		bind:this={audio}
		preload="none"
		onpause={() => (playing = undefined)}
		onended={() => (playing = undefined)}
		ontimeupdate={() => (time = audio?.currentTime ?? 0)}
	></audio>

	{#if !music || music.options.length === 0}
		<Empty icon="music" title={music?.more ? wait : "No tracks yet"}>
			{#if !music?.more}<button
					class="btn primary"
					onclick={() => app.review.act({ type: "music", more: true })}
					><Icon name="plus" small />Ask for tracks</button
				>{/if}
		</Empty>
	{:else}
		<ul class="tracks">
			{#each music.options as track (track.id)}
				{@const kept = music.keep === track.id && music.decision === "kept"}
				<li class="track" class:kept class:on={playing === track.id} data-track={track.id}>
					<button
						class="btn icon solid"
						aria-label="{playing === track.id ? 'Pause' : 'Play'} {track.title}"
						disabled={!track.src}
						onclick={() => play(track.id, track.src)}
					>
						<Icon name={playing === track.id ? "pause" : "play"} />
					</button>
					<div class="info">
						<p class="title">{track.title}</p>
						<p class="mood">{track.mood}</p>
					</div>
					<span class="len num">{playing === track.id ? clock(time) : clock(track.seconds)}</span>
					{#if kept}
						<span class="chosen"><Icon name="check" small />In use</span>
					{:else}
						<button class="btn solid" onclick={() => decide({ type: "music", keep: track.id })}
							>Use</button
						>
					{/if}
				</li>
			{/each}
		</ul>
		<div class="more">
			<button
				class="btn solid"
				disabled={music.more}
				onclick={() => app.review.act({ type: "music", more: true })}
			>
				<Icon name="plus" small />Ask for more
			</button>
			{#if music.more}<p class="wait" data-session={app.review.session}>{wait}</p>{/if}
		</div>
	{/if}
</section>

<style>
	.music {
		width: 100%;
		max-width: 760px;
		margin: 0 auto;
		padding: 20px var(--gutter) 64px;
	}
	.tracks {
		display: grid;
		gap: 8px;
	}
	.track {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 14px;
		padding: 10px 12px;
		border: 1px solid var(--line-soft);
		border-radius: var(--radius-lg);
		background: var(--surface);
		transition:
			border-color var(--duration-fast) var(--ease-smooth-out),
			background-color var(--duration-fast) var(--ease-smooth-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.track:hover {
			border-color: var(--line);
		}
	}
	.track.on {
		border-color: var(--accent-line);
	}
	.track.kept {
		border-color: color-mix(in oklab, var(--ok) 45%, var(--line));
		background: color-mix(in oklab, var(--ok) 5%, var(--surface));
	}
	.title {
		overflow: hidden;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mood {
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	.len {
		color: var(--faint);
		font: 500 var(--fs-xs) / 1 var(--mono);
	}
	.chosen {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-width: 84px;
		justify-content: center;
		color: var(--ok);
		font-size: var(--fs-xs);
		font-weight: 600;
	}
	.more {
		margin-top: 12px;
	}
	.wait {
		margin-top: 8px;
		font-size: 13px;
		color: var(--dim);
	}
	.wait[data-session="idle"] {
		color: var(--warn-text);
	}
	@media (max-width: 760px) {
		.track {
			grid-template-columns: auto minmax(0, 1fr) auto;
		}
		.len {
			display: none;
		}
		.track > :last-child {
			grid-column: 1 / -1;
		}
	}
</style>
