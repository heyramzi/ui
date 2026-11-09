<script lang="ts">
	import { CopyButton } from "@heyramzi/ui/components/copy";
	import { ArrowRight } from "phosphor-svelte";
	import { homeSections } from "#lib/home/picks.js";
	import Tile from "#lib/Tile.svelte";

	let { data } = $props();
	const install = "pnpm add @heyramzi/ui";
</script>

<svelte:head><title>heyramzi/ui</title></svelte:head>

<!-- One width, one grid and one heading scale from the hero down, in the nav's order. -->
<div class="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
	<header class="pb-16 pt-16 sm:pt-24">
		<h1 class="max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
			Svelte 5 parts for real product screens.
		</h1>
		<p class="mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
			Task boards, timelines, a drawing canvas, charts, an editor and AI chat, in one package.
		</p>
		<div class="mt-8 flex flex-wrap items-center gap-2">
			<a
				href="/docs"
				class="t-press inline-flex h-10 items-center rounded-(--radius-lg) bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-(--duration-quick) hover:opacity-85"
				>Read the docs</a
			>
			<a
				href="/components"
				class="t-press inline-flex h-10 items-center rounded-(--radius-lg) bg-card px-4 text-sm font-medium shadow-(--elev-card) transition-shadow duration-(--duration-quick) hover:shadow-(--elev-card-hover)"
				>Browse all parts</a
			>
			<div
				class="inline-flex h-10 items-center gap-3 rounded-(--radius-lg) border border-border pl-3.5 pr-1 font-mono text-[13px] sm:ml-2"
			>
				<span class="flex gap-2"
					><span class="select-none text-muted-foreground" aria-hidden="true">$</span
					>{install}</span
				>
				<CopyButton value={install} label="Copy install command" />
			</div>
		</div>
	</header>

	<div class="flex flex-col gap-20">
		{#each homeSections as section, i (section.id)}
			<section aria-labelledby={section.id} class="border-t border-border pt-8">
				<div class="mb-6 flex items-end justify-between gap-4">
					<div class="min-w-0">
						<h2 id={section.id} class="scroll-mt-24 text-xl font-semibold tracking-tight">
							<span class="mr-2 font-normal tabular-nums text-muted-foreground"
								>{String(i + 1).padStart(2, "0")}</span
							>{section.title}
						</h2>
						<p class="mt-1 text-sm text-muted-foreground">{section.categories.join(", ")}</p>
					</div>
					<a
						href="/{section.id}"
						class="group inline-flex min-h-8 shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
					>
						All <span class="tabular-nums">{section.count}</span>
						<ArrowRight
							class="size-3.5 transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
							aria-hidden="true"
						/>
					</a>
				</div>
				<div class="grid gap-4 md:grid-cols-3">
					{#each section.slugs as slug (slug)}<Tile entry={data.demos[slug]} />{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
