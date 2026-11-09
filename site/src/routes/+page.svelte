<script lang="ts">
	import { ArrowRight } from "phosphor-svelte";
	import LazyDemo from "#lib/home/LazyDemo.svelte";
	import Piece from "#lib/home/Piece.svelte";
	import WorkStage from "#lib/home/WorkStage.svelte";

	// Every demo here loads on its own chunk as it nears the viewport, so the canvas, the
	// charts and the editor cost nothing until someone scrolls to them.
	const rest = [
		{ href: "/foundations", title: "Foundations" },
		{ href: "/components", title: "Components" },
		{ href: "/effects", title: "Effects" },
		{ href: "/charts", title: "Charts" },
		{ href: "/blocks", title: "Blocks" },
	];
</script>

<svelte:head><title>heyramzi/ui</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 sm:px-6">
	<header
		class="flex flex-col gap-6 pb-8 pt-14 sm:pt-20 lg:flex-row lg:items-end lg:justify-between"
	>
		<div class="max-w-2xl">
			<h1 class="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
				Svelte 5 parts for real product screens.
			</h1>
			<p class="mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
				Task boards, timelines, a drawing canvas, charts, an editor and AI chat, in one package.
				Everything on this page runs, so try it.
			</p>
		</div>
		<div class="flex shrink-0 gap-2">
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
		</div>
	</header>

	<WorkStage />

	<div class="mt-16 grid gap-x-6 gap-y-12 lg:grid-cols-12">
		<Piece
			title="Canvas"
			href="/components/canvas"
			importPath="@heyramzi/ui/canvas"
			plain
			class="lg:col-span-8"
		>
			<LazyDemo load={() => import("#lib/demos/canvas.svelte")} height={440} label="Canvas" />
		</Piece>

		<div class="flex flex-col gap-12 lg:col-span-4">
			<Piece title="Prompt input" href="/components/ai-prompt" importPath="@heyramzi/ui/ai">
				<LazyDemo
					load={() => import("#lib/demos/ai-prompt.svelte")}
					height={150}
					label="Prompt input"
				/>
			</Piece>
			<Piece
				title="Reasoning"
				href="/components/reasoning"
				importPath="@heyramzi/ui/ai"
				class="flex-1"
			>
				<LazyDemo
					load={() => import("#lib/demos/reasoning.svelte")}
					height={120}
					label="Reasoning"
				/>
			</Piece>
		</div>

		<Piece
			title="Area chart"
			href="/components/area-chart"
			importPath="@heyramzi/ui/charts"
			class="lg:col-span-5"
		>
			<LazyDemo
				load={() => import("#lib/demos/area-chart.svelte")}
				height={300}
				label="Area chart"
			/>
		</Piece>

		<Piece
			title="Rich editor"
			href="/components/rich-editor"
			importPath="@heyramzi/ui/editor"
			plain
			class="lg:col-span-7"
		>
			<LazyDemo
				load={() => import("#lib/demos/rich-editor.svelte")}
				height={300}
				label="Rich editor"
			/>
		</Piece>

		<Piece title="Motion" href="/effects" importPath="@heyramzi/ui/effects" class="lg:col-span-12">
			<div
				class="grid w-full items-center gap-10 py-4 md:grid-cols-[1fr_auto] lg:grid-cols-[1.2fr_1fr_auto]"
			>
				<LazyDemo
					load={() => import("#lib/demos/text-effect.svelte")}
					height={180}
					label="Text effect"
				/>
				<LazyDemo
					load={() => import("#lib/demos/hold-to-confirm.svelte")}
					height={80}
					label="Hold to confirm"
				/>
				<LazyDemo
					load={() => import("#lib/demos/border-beam.svelte")}
					height={300}
					label="Border beam"
					class="md:col-span-2 lg:col-span-1"
				/>
			</div>
		</Piece>
	</div>

	<nav
		aria-labelledby="rest"
		class="mt-20 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-10"
	>
		<h2 id="rest" class="shrink-0 text-sm font-medium">The rest of the kit</h2>
		<ul class="flex flex-wrap gap-x-6 gap-y-2">
			{#each rest as link (link.href)}
				<li>
					<a
						href={link.href}
						class="group inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground transition-colors duration-(--duration-quick) hover:text-foreground"
					>
						{link.title}
						<ArrowRight
							class="size-3.5 transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
							aria-hidden="true"
						/>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>
