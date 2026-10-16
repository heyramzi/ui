<script lang="ts" module>
	import type { ShowcaseSectionMeta } from "#src/showcase/types.js";

	export interface ShowcaseNavProps {
		sections: ShowcaseSectionMeta[];
	}
</script>

<script lang="ts">
	import { onMount } from "svelte";

	let { sections }: ShowcaseNavProps = $props();

	let active = $state(sections[0]?.id ?? "");
	// Nothing is written back until the reader's place has been restored, or the
	// observer's first call would overwrite it with whatever the top of the page is.
	let restored = $state(false);

	const storeKey = () => `sc-rail-active:${location.pathname}`;

	// Consecutive sections sharing a group are drawn under one heading.

	// Grouping by run rather than by key means the page's own order is the rail's order, and a section can be moved without also moving it in a second list.
	const runs = $derived(
		sections.reduce<{ group?: string; items: ShowcaseSectionMeta[] }[]>((acc, section) => {
			const last = acc.at(-1);
			if (last && last.group === section.group) last.items.push(section);
			else acc.push({ group: section.group, items: [section] });
			return acc;
		}, []),
	);

	// The rail follows the reader rather than the last click: an anchor jump and a
	// scroll both end in the same place, so only one source of truth is needed.
	$effect(() => {
		const targets = sections
			.map((section) => document.getElementById(section.id))
			.filter((element): element is HTMLElement => element !== null);
		if (targets.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]) active = visible[0].target.id;
			},
			{ rootMargin: "-12% 0px -75% 0px", threshold: 0 },
		);
		for (const target of targets) observer.observe(target);
		return () => observer.disconnect();
	});

	// The band the observer watches sits near the top of the viewport, and the last section is often too short to reach it,

	// so the rail stopped one entry early at the foot of the page. The bottom of the scroll names the last section.
	$effect(() => {
		const onScroll = () => {
			const last = sections.at(-1)?.id;
			if (last && window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
				active = last;
			}
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	});

	// A reload put the reader back at the top.

	// The browser does restore a scroll offset, but the charts, images and fonts on this page settle after it, so the offset it restores is no longer the section it

	// was taken from. The section id survives instead: the hash when the reader followed one, the last section read otherwise.
	onMount(() => {
		let wanted = decodeURIComponent(location.hash.slice(1));
		if (!wanted) {
			try {
				wanted = sessionStorage.getItem(storeKey()) ?? "";
			} catch {
				wanted = "";
			}
		}
		if (!wanted || !sections.some((section) => section.id === wanted)) {
			restored = true;
			return;
		}

		active = wanted;
		// Two frames: the first paints the sections, the second lets what is inside
		// them take its height, so the anchor lands on the heading and not above it.
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				document.getElementById(wanted)?.scrollIntoView({ block: "start" });
				restored = true;
			}),
		);
	});

	$effect(() => {
		if (!restored || !active) return;
		try {
			sessionStorage.setItem(storeKey(), active);
		} catch {
			// A private window refuses the write. The rail still follows the reader.
		}
	});
</script>

<nav aria-label="Component sections">
	{#each runs as run, index (run.group ?? index)}
		{#if run.group}
			<p class="sc-rail-group">{run.group}</p>
		{/if}
		<ul>
			{#each run.items as section (section.id)}
				<li>
					<a
						href="#{section.id}"
						data-active={active === section.id ? "true" : undefined}
						aria-current={active === section.id ? "page" : undefined}
					>
						<span class="sc-rail-label">{section.label}</span>
						<span class="sc-rail-count">{section.demos || section.listed}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/each}
</nav>

<style>
	/*
	 * WHY a rail and not a row of pills: the row was one line of chips that ran to
	 */

	/*
	 * nine sections and wrapped, so the reader's place in a long page was a chip somewhere in a block of chips. A vertical list holds a stable order, has room
	 */

	/*
	 * for group headings, and leaves the whole content column to the components.
	 */
	nav {
		position: sticky;
		top: var(--showcase-nav-top, 0px);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		max-height: calc(100dvh - var(--showcase-nav-top, 0px));
		padding: 1.25rem 0.75rem 2rem 0.4375rem;
		overflow-y: auto;
		/* WHY only x: `contain` on y stopped this zero-overflow rail chaining the wheel to the page. */
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
	}

	.sc-rail-group {
		margin: 1.125rem 0 0.375rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted-foreground, var(--muted-foreground));
		opacity: 0.75;
	}

	.sc-rail-group:first-child {
		margin-top: 0;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.3125rem 0.5rem 0.3125rem 0.6875rem;
		border-radius: var(--radius-lg, 8px);
		font-size: 0.78125rem;
		line-height: 1.35;
		color: var(--color-muted-foreground, var(--muted-foreground));
		text-decoration: none;
		transition:
			color var(--duration-quick, 150ms) var(--ease-smooth-out, ease),
			background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease);
	}

	a:hover {
		color: var(--color-foreground, var(--foreground));
		background: color-mix(in oklab, var(--color-muted, var(--muted)) 60%, transparent);
	}

	/*
	 * The active row is a filled slot with a bar in the gutter. The bar is what the
	 */

	/*
	 * eye finds when it comes back to the rail after reading. A fill alone is too
	 */

	/*
	 * quiet at this weight, and a full-strength pill is too loud for a list this long.
	 */
	a[data-active] {
		color: var(--color-foreground, var(--foreground));
		font-weight: 500;
		background: color-mix(in oklab, var(--color-muted, var(--muted)) 90%, transparent);
	}

	a[data-active]::before {
		content: "";
		position: absolute;
		inset-block: 0.3125rem;
		inset-inline-start: -0.375rem;
		width: 2px;
		border-radius: 999px;
		background: var(--color-ring, var(--ring));
	}

	.sc-rail-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.sc-rail-count {
		flex-shrink: 0;
		font-size: 0.625rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-muted-foreground, var(--muted-foreground));
		opacity: 0.7;
	}

	@media (prefers-reduced-motion: reduce) {
		a {
			transition: none;
		}
	}
</style>
