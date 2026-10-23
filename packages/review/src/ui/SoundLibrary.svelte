<script lang="ts">
	import { onDestroy } from "svelte";
	import type { SoundCard } from "#src/core/types.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import LibraryEmpty from "#src/ui/LibraryEmpty.svelte";
	import LibraryGroup from "#src/ui/LibraryGroup.svelte";
	import LibrarySearch from "#src/ui/LibrarySearch.svelte";
	import Spark from "#src/ui/Spark.svelte";

	let { sounds }: { sounds: SoundCard[] } = $props();
	let query = $state("");

	/** Bars per waveform. */
	const BARS = 36;

	/** One player for the whole library: starting a sound stops the one before it. */
	let playing = $state<string | null>(null);
	let progress = $state(0);
	let broken = $state<Record<string, boolean>>({});
	let player: HTMLAudioElement | undefined;
	let frame = 0;

	function follow() {
		if (player && player.duration) progress = player.currentTime / player.duration;
		frame = requestAnimationFrame(follow);
	}
	function stop() {
		cancelAnimationFrame(frame);
		player?.pause();
		playing = null;
		progress = 0;
	}
	async function toggle(card: SoundCard) {
		if (!card.src) return;
		if (playing === card.id) return stop();
		stop();
		player ??= new Audio();
		player.onended = stop;
		player.onerror = () => {
			broken[card.id] = true;
			stop();
		};
		player.src = card.src;
		playing = card.id;
		try {
			await player.play();
			frame = requestAnimationFrame(follow);
		} catch {
			broken[card.id] = true;
			stop();
		}
	}
	onDestroy(stop);

	/** Each card's loudest moment per bar, measured once when the card first scrolls into view. */
	let peaks = $state<Record<string, number[]>>({});
	async function measure(card: SoundCard) {
		if (!card.src || peaks[card.id]) return;
		try {
			const bytes = await (await fetch(card.src)).arrayBuffer();
			const audio = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(bytes);
			const data = audio.getChannelData(0);
			const size = Math.max(1, Math.floor(data.length / BARS));
			const raw = Array.from({ length: BARS }, (_, i) => {
				let top = 0;
				for (let j = i * size; j < Math.min(data.length, (i + 1) * size); j++)
					top = Math.max(top, Math.abs(data[j] ?? 0));
				return top;
			});
			const loudest = Math.max(...raw) || 1;
			peaks[card.id] = raw.map((value) => value / loudest);
		} catch {
			// A card whose file won't decode keeps its flat line and still plays.
		}
	}
	function watch(node: HTMLElement, card: SoundCard) {
		if (typeof IntersectionObserver === "undefined") {
			void measure(card);
			return {};
		}
		const seen = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			seen.disconnect();
			void measure(card);
		});
		seen.observe(node);
		return { destroy: () => seen.disconnect() };
	}

	/** What the card calls a sound: the host's plain name, or the id as words ("whoosh-deep" is "Whoosh deep") when it named none. */
	const title = (card: SoundCard): string =>
		card.name === card.id
			? card.id.replace(/[-_]+/g, " ").replace(/^./, (first) => first.toUpperCase())
			: card.name;

	const length = (seconds: number): string =>
		seconds >= 60
			? `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`
			: `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)} s`;

	const shown = $derived(
		query.trim()
			? sounds.filter((card) =>
					`${title(card)} ${card.group ?? ""} ${card.job ?? ""}`
						.toLowerCase()
						.includes(query.trim().toLowerCase()),
				)
			: sounds,
	);
	/** The roster's own groups, in the order the roster lists them. */
	const groups = $derived(
		[...new Set(shown.map((card) => card.group ?? "Other"))].map((group) => ({
			group,
			cards: shown.filter((card) => (card.group ?? "Other") === group),
		})),
	);
</script>

<div class="library">
	{#if sounds.length}
		<LibrarySearch
			bind:value={query}
			label="Search sounds"
			placeholder="Search {sounds.length} sounds"
		/>
	{/if}
	{#each groups as { group, cards } (group)}
		<LibraryGroup title={group} count={cards.length}>
			{#each cards as card (card.id)}
				{@const lit = playing === card.id ? Math.round(progress * BARS) : 0}
				<li
					class="has-spark"
					class:playing={playing === card.id}
					aria-current={playing === card.id ? "true" : undefined}
					use:watch={card}
				>
					<figure>
						<button
							type="button"
							class="play"
							disabled={!card.src || broken[card.id]}
							aria-label="{playing === card.id ? 'Pause' : 'Play'} {title(card)}"
							data-tip={!card.src
								? "Sound file missing"
								: broken[card.id]
									? "This sound won't play"
									: undefined}
							onclick={() => toggle(card)}
						>
							<Icon name={playing === card.id ? "pause" : "play"} />
						</button>
						<div class="wave" aria-hidden="true">
							{#each { length: BARS } as _, i (i)}
								<span
									class:on={i < lit}
									style:height="{Math.max(8, Math.round((peaks[card.id]?.[i] ?? 0.08) * 100))}%"
								></span>
							{/each}
						</div>
					</figure>
					{#if card.agent}
						<Spark label="Copy {title(card)} for your agent" text={card.agent} />
					{/if}
					<div class="head">
						<b>{title(card)}</b>
						<span class="len">{length(card.seconds)}</span>
					</div>
					{#if card.job}<small class="job">{card.job}</small>{/if}
				</li>
			{/each}
		</LibraryGroup>
	{:else}
		<LibraryEmpty {query} onclear={() => (query = "")}>
			No sounds yet. Your agent can add the sound effects here.
		</LibraryEmpty>
	{/each}
</div>

<style>
	/* The playing card gets a heavier accent edge and the pause icon, so it isn't marked by colour alone. */
	li.playing {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	/* The sound is the play button and its shape, on the page ground inside the card. */
	figure {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 64px;
		box-sizing: border-box;
		margin: 0 0 6px;
		padding: 6px;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--ground);
		box-shadow: inset 0 0 0 1px var(--line-soft);
	}
	.play {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: 44px;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: var(--radius-xs);
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--text);
		cursor: pointer;
		transition: background-color var(--duration-quick) var(--ease-smooth-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.play:hover:not(:disabled) {
			background: var(--press);
		}
	}
	.play:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.play:active:not(:disabled) {
		scale: 0.96;
	}
	.play:disabled {
		color: var(--faint);
		cursor: not-allowed;
	}
	.playing .play {
		color: var(--accent);
	}
	.wave {
		display: flex;
		flex: 1;
		gap: 2px;
		align-items: center;
		min-width: 0;
		height: 100%;
	}
	.wave span {
		flex: 1;
		min-width: 1px;
		border-radius: var(--radius-xs);
		/* WHY: --faint was too pale on the light card; mixing from the text colour holds about 4:1 in both themes. */
		background: color-mix(in oklab, var(--text) 60%, var(--ground));
	}
	.wave span.on {
		background: var(--accent);
	}
	b {
		overflow: hidden;
		font-size: var(--fs-sm);
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	li small {
		color: var(--dim);
		font-size: var(--fs-xs);
		line-height: 1.4;
	}
	/* One title row: the name, and the length on the right, so the card has a title and one line under it and nothing else. */
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		min-width: 0;
	}
	.head b {
		min-width: 0;
	}
	.len {
		flex: none;
		color: var(--dim);
		font-size: var(--fs-xs);
		font-variant-numeric: tabular-nums;
	}
	@media (prefers-reduced-motion: reduce) {
		.play {
			transition: none;
		}
	}
</style>
