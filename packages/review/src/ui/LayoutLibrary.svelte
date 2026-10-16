<script lang="ts">
	import type { LibraryCard } from "#src/core/types.js";
	import LayoutDiagram from "#src/diagrams/LayoutDiagram.svelte";
	import LibraryEmpty from "#src/ui/LibraryEmpty.svelte";
	import LibraryGroup from "#src/ui/LibraryGroup.svelte";
	import LibrarySearch from "#src/ui/LibrarySearch.svelte";
	import Spark from "#src/ui/Spark.svelte";

	let { layouts }: { layouts: LibraryCard[] } = $props();
	let query = $state("");

	/** A card whose clip didn't load falls back to its diagram. */
	let clipFailed = $state<Record<string, boolean>>({});

	/**
	 * A clip rests on a held frame (it fades in from nothing, so frame 0 is blank) and plays only
	 * while its card is hovered or focused. On touch there is no hover, so it plays while mostly in
	 * view. Reduced motion never plays it.
	 */
	function clip(video: HTMLVideoElement) {
		if (typeof matchMedia !== "function") return {};
		const reduced = matchMedia("(prefers-reduced-motion: reduce)");
		const touch = matchMedia("(hover: none)").matches;
		const card = video.closest("li") ?? video;
		let rest = 0;
		const hold = () => {
			rest = Math.min(2.2, video.duration / 2 || 0);
			video.currentTime = rest;
		};
		const play = () => {
			if (!reduced.matches) void video.play().catch(() => undefined);
		};
		const stop = () => {
			video.pause();
			video.currentTime = rest;
		};
		if (video.readyState >= 1) hold();
		else video.addEventListener("loadedmetadata", hold, { once: true });
		const seen =
			touch && typeof IntersectionObserver !== "undefined"
				? new IntersectionObserver(
						([entry]) => (entry?.isIntersecting && entry.intersectionRatio >= 0.6 ? play() : stop()),
						{ threshold: [0, 0.6] },
					)
				: undefined;
		seen?.observe(video);
		if (!touch) {
			card.addEventListener("pointerenter", play);
			card.addEventListener("pointerleave", stop);
		}
		card.addEventListener("focusin", play);
		card.addEventListener("focusout", stop);
		return {
			destroy() {
				seen?.disconnect();
				card.removeEventListener("pointerenter", play);
				card.removeEventListener("pointerleave", stop);
				card.removeEventListener("focusin", play);
				card.removeEventListener("focusout", stop);
			},
		};
	}

	const shown = $derived(
		query.trim()
			? layouts.filter((card) =>
					`${card.name} ${card.group ?? ""} ${card.job ?? ""}`
						.toLowerCase()
						.includes(query.trim().toLowerCase()),
				)
			: layouts,
	);
	/** The pack's own groups, in the order the pack lists them. */
	const groups = $derived(
		[...new Set(shown.map((card) => card.group ?? "Other"))].map((group) => {
			const cards = shown.filter((card) => (card.group ?? "Other") === group);
			// A row of 9:16 cards takes a narrower column, so a row of Shorts reads as a row.
			const tall = cards.every((card) => card.preview.h > card.preview.w);
			return { group, cards, min: tall ? 170 : 220 };
		}),
	);
</script>

<div class="library">
	<LibrarySearch bind:value={query} label="Search layouts" placeholder="Search {layouts.length} layouts" />
	{#each groups as { group, cards, min } (group)}
		<LibraryGroup title={group} count={cards.length} {min}>
			{#each cards as card (card.name)}
				<li class="has-spark">
					<figure style:aspect-ratio="{card.preview.w} / {card.preview.h}">
						{#if card.clip && !clipFailed[card.name]}
							<video
								class="clip"
								src={card.clip}
								aria-label={card.name}
								muted
								loop
								preload="metadata"
								playsinline
								use:clip
								onerror={() => (clipFailed[card.name] = true)}
							></video>
						{:else}
							<LayoutDiagram
								w={card.preview.w}
								h={card.preview.h}
								boxes={card.preview.boxes}
								label={card.name}
							/>
						{/if}
					</figure>
					{#if card.agent}
						<Spark label="Copy {card.name} for your agent" text={card.agent} />
					{/if}
					<b>{card.name}</b>
					{#if card.job}<small>{card.job}</small>{/if}
				</li>
			{/each}
		</LibraryGroup>
	{:else}
		<LibraryEmpty {query} onclear={() => (query = "")}>No layouts yet.</LibraryEmpty>
	{/each}
</div>

<style>
	/* A framed picture inside the card, on the page ground so the card isn't a card in a card. */
	figure {
		margin: 0 0 4px;
		padding: 6px;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--ground);
		box-shadow: inset 0 0 0 1px var(--line-soft);
	}
	/* A clip stands in for the diagram on the same dark frame, whole and never cropped. */
	.clip {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: var(--radius-xs);
		background: var(--scene-canvas);
		object-fit: contain;
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
</style>
