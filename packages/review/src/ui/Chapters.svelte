<script lang="ts">
	import type { Paragraph } from "#src/core/types.js";

	let { paragraphs, host }: { paragraphs: Paragraph[]; host: HTMLElement | undefined } = $props();
	let nav = $state<HTMLElement>();
	const chapters = $derived(
		paragraphs
			.map((p, i) => ({ i, at: p.at, title: p.chapter }))
			.filter((c): c is { i: number; at: string; title: string } => !!c.title),
	);
	let spy = $state(0);

	$effect(() => {
		const pane = host?.closest<HTMLElement>(".pane-scroll");
		if (!pane || chapters.length < 2) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries)
					if (entry.isIntersecting) spy = Number((entry.target as HTMLElement).dataset.chapter);
			},
			{ root: pane, rootMargin: "-56px 0px -70% 0px" },
		);
		for (const el of pane.querySelectorAll("[data-chapter]")) observer.observe(el);
		return () => observer.disconnect();
	});

	function jump(i: number) {
		spy = i;
		const target = host
			?.closest(".pane-scroll")
			?.querySelector<HTMLElement>(`[data-chapter="${i}"]`);
		target?.scrollIntoView({
			block: "start",
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
		});
	}

	$effect(() => {
		void spy;
		nav
			?.querySelector<HTMLElement>("[aria-current='true']")
			?.scrollIntoView({ block: "nearest", inline: "nearest" });
	});
</script>

{#if chapters.length > 1}
	<nav class="chapters" aria-label="Chapters" bind:this={nav}>
		{#each chapters as c (c.i)}
			<button class="chap" aria-current={spy === c.i} title={c.title} onclick={() => jump(c.i)}>
				<span class="t num">{c.at}</span><span class="name">{c.title}</span>
			</button>
		{/each}
	</nav>
{/if}

<style>
	.chapters {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		gap: 4px;
		margin: 0 calc(-1 * var(--gutter)) 12px;
		padding: 8px var(--gutter);
		overflow-x: auto;
		background: color-mix(in oklab, var(--ground) 88%, transparent);
		backdrop-filter: blur(var(--blur-medium));
		scrollbar-width: none;
		mask-image: linear-gradient(
			90deg,
			transparent,
			var(--ground) var(--gutter),
			var(--ground) calc(100% - 32px),
			transparent
		);
	}
	.chap {
		display: inline-flex;
		align-items: baseline;
		flex: none;
		gap: 6px;
		max-width: 220px;
		height: 28px;
		padding: 0 10px;
		align-items: center;
		border-radius: var(--radius-sm);
		color: var(--dim);
		font-size: var(--fs-xs);
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			color var(--duration-quick) var(--ease-smooth-out),
			transform var(--duration-micro) var(--ease-smooth-out);
	}
	.chap:hover {
		background: var(--hover);
		color: var(--text);
	}
	.chap:active {
		transform: scale(var(--scale-medium));
	}
	.chap[aria-current="true"] {
		background: var(--raised);
		color: var(--text);
	}
	.chap .t {
		color: var(--faint);
		font-family: var(--mono);
		font-size: var(--fs-xs);
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
