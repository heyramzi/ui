<script lang="ts">
	import { CopyButton } from "@heyramzi/ui/components/copy";
	import { ArrowRight, ArrowUpRight } from "phosphor-svelte";
	import HeroScreen from "#lib/home/HeroScreen.svelte";
	import LazyDemo from "#lib/home/LazyDemo.svelte";
	import { picks, sectionIndex } from "#lib/home/picks.js";

	const install = "pnpm add @heyramzi/ui";
	const total = sectionIndex.reduce((n, s) => n + s.count, 0);
</script>

<svelte:head><title>heyramzi/ui</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
	<!-- The pitch on the left, the kit running on the right: the first screen shows parts
	     working, not a list of what they are. -->
	<header
		class="grid items-center gap-12 pb-16 pt-12 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 lg:pb-24"
	>
		<div>
			<h1 class="max-w-xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
				Svelte 5 parts for real product screens.
			</h1>
			<p class="mt-4 max-w-lg text-pretty text-lg text-muted-foreground">
				Task boards, timelines, a drawing canvas, charts, an editor and AI chat, in one package.
			</p>
			<div
				class="mt-8 flex h-11 w-full max-w-sm items-center justify-between gap-3 rounded-(--radius-lg) bg-card pl-4 pr-1.5 font-mono text-[13px] shadow-(--elev-card)"
			>
				<span class="flex min-w-0 gap-2 truncate"
					><span class="select-none text-muted-foreground" aria-hidden="true">$</span
					>{install}</span
				>
				<CopyButton value={install} label="Copy install command" />
			</div>
			<div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
				<a
					href="/docs"
					class="t-press inline-flex h-10 items-center rounded-(--radius-lg) bg-foreground px-4 text-sm font-medium text-background transition-opacity duration-(--duration-quick) hover:opacity-85"
					>Read the docs</a
				>
				<a
					href="/components"
					class="group inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
				>
					Browse all {total} parts
					<ArrowRight
						class="size-3.5 transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
						aria-hidden="true"
					/>
				</a>
			</div>
		</div>
		<HeroScreen />
	</header>

	<!-- Live parts at full size, wide and narrow tiles trading sides row to row. -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
		{#each picks as pick (pick.slug)}
			<section
				aria-labelledby="pick-{pick.slug}"
				class="relative flex min-w-0 flex-col overflow-hidden rounded-(--radius-2xl) bg-card shadow-(--elev-card) {pick.span}"
			>
				<a
					id="pick-{pick.slug}"
					href="/components/{pick.slug}"
					class="group absolute left-4 top-3.5 z-10 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
				>
					{pick.title}
					<ArrowUpRight
						class="size-3.5 opacity-0 transition-opacity duration-(--duration-quick) group-hover:opacity-100 group-focus-visible:opacity-100"
						aria-hidden="true"
					/>
				</a>
				<div class="flex flex-1 items-center px-5 pb-6 pt-14">
					<LazyDemo load={pick.load} height={pick.height - 80} label={pick.title} />
				</div>
			</section>
		{/each}
	</div>

	<section aria-labelledby="sections" class="mt-24">
		<h2 id="sections" class="text-xl font-semibold tracking-tight">Browse by section</h2>
		<ul class="mt-6 border-t border-border">
			{#each sectionIndex as section (section.id)}
				<li class="border-b border-border">
					<a href="/{section.id}" class="group flex items-baseline gap-6 py-5">
						<span class="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
							<span
								class="shrink-0 text-lg font-semibold tracking-tight transition-colors duration-(--duration-quick) group-hover:text-foreground/70 sm:w-48"
								>{section.title}</span
							>
							<span class="text-sm text-muted-foreground">{section.categories}</span>
						</span>
						<span
							class="inline-flex shrink-0 items-center gap-1.5 text-sm tabular-nums text-muted-foreground"
						>
							{section.count}
							<ArrowRight
								class="size-3.5 transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
								aria-hidden="true"
							/>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
