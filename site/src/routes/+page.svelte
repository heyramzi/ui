<script lang="ts">
	import { entries, entryOf, sections } from "#lib/registry.js";
	import Tile from "#lib/Tile.svelte";
	import { ArrowRight } from "phosphor-svelte";

	// Each section leads with one part per category, picking ones that fit, since a demo taller
	// than a tile shrinks to mush.
	const fits = (slug: string | { href: string }): slug is string =>
		typeof slug === "string" && (entryOf(slug).height ?? 280) <= 400;
	const leads = (section: (typeof sections)[number]) => {
		const spread = section.categories
			.map((c) => c.items.find(fits))
			.filter((slug): slug is string => slug !== undefined);
		const rest = section.categories
			.flatMap((c) => c.items.filter(fits))
			.filter((slug) => !spread.includes(slug));
		return [...spread, ...rest].slice(0, 3).map(entryOf);
	};
	const countOf = (id: string) => entries.filter((e) => e.section === id).length;
</script>

<svelte:head><title>heyramzi/ui</title></svelte:head>

<section class="mx-auto max-w-4xl px-6 pb-10 pt-24 text-center">
	<p
		class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
	>
		<span class="size-1.5 rounded-full bg-emerald-500"></span> Svelte 5 · Tailwind v4 · {entries.length}
		parts
	</p>
	<h1 class="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
		Components for our product teams.
	</h1>
	<p class="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
		From the tokens up to whole screens, in one Svelte 5 package.
	</p>
	<div class="mt-8 flex justify-center gap-2">
		<a
			href="/docs"
			class="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
			>Get started</a
		>
		<a
			href="/components"
			class="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/30"
			>Browse components</a
		>
	</div>
</section>

{#each sections as section, i (section.id)}
	<section class="mx-auto mt-16 max-w-6xl px-6" aria-labelledby={section.id}>
		<div class="mb-6 flex items-end justify-between gap-4">
			<div>
				<p class="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
				<h2 id={section.id} class="mt-1 scroll-mt-24 text-2xl font-semibold tracking-tight">
					{section.title}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{section.categories.map((c) => c.title).join(" · ")}
				</p>
			</div>
			<a
				href="/{section.id}"
				class="group flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				All {countOf(section.id)}
				<ArrowRight
					class="size-3.5 transition-transform group-hover:translate-x-0.5"
					aria-hidden="true"
				/>
			</a>
		</div>
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each leads(section) as entry (entry.slug)}<Tile {entry} />{/each}
		</div>
	</section>
{/each}
