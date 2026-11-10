<script lang="ts">
	import { cards, categoryId } from "#lib/nav.js";
	import { importLinesOf } from "#lib/registry.js";
	import { a11yNotes } from "#lib/a11y-notes.js";
	import { usageSnippets } from "#lib/usage-snippets.js";
	import ComponentApi, { apiAnchor } from "#lib/ComponentApi.svelte";
	import CodeSnippet from "#lib/CodeSnippet.svelte";
	import DocHeading from "#lib/DocHeading.svelte";
	import ExampleViewer from "#lib/ExampleViewer.svelte";
	import InstallCommand from "#lib/InstallCommand.svelte";
	import OnThisPage, { type TocItem } from "#lib/OnThisPage.svelte";
	import Viewer from "#lib/Viewer.svelte";
	import { Kbd } from "@heyramzi/ui/shadcn/kbd";
	import * as Table from "@heyramzi/ui/shadcn/table";
	import { ArrowLeft, ArrowRight, ArrowUpRight, GithubLogo, MarkdownLogo } from "phosphor-svelte";

	let { data } = $props();
	const entry = $derived(data.entry);
	const section = $derived(data.section);
	const index = $derived(cards.findIndex((c) => c.slug === entry.slug));
	const prev = $derived(cards[index - 1]);
	const next = $derived(cards[index + 1]);
	const usage = $derived(importLinesOf(entry));
	const markup = $derived(usageSnippets[entry.slug]);
	const a11y = $derived(a11yNotes[entry.slug]);

	const sourceDir = $derived(entry.sourceFiles[0]?.split("/").slice(0, -1).join("/"));
	// The first Bits UI part a page spreads, kebab-cased, is the slug of its Bits UI docs page.
	const bits = $derived(
		data.api
			.flatMap((part) => part.bases)
			.find((base) => base.from === "bits-ui")
			?.label.split(".")[0]
			.replace(/([a-z])([A-Z])/g, "$1-$2")
			.toLowerCase(),
	);
	const packages = $derived(bits ? "@heyramzi/ui bits-ui" : "@heyramzi/ui");

	const links = $derived(
		[
			sourceDir && {
				href: `https://github.com/heyramzi/ui/tree/main/${sourceDir}`,
				label: "Source",
				icon: GithubLogo,
			},
			bits && {
				href: `https://bits-ui.com/docs/components/${bits}`,
				label: "Bits UI",
				icon: ArrowUpRight,
			},
			{ href: `/components/${entry.slug}.md`, label: "Markdown", icon: MarkdownLogo },
		].filter((link) => !!link),
	);

	const toc: TocItem[] = $derived([
		{ id: "installation", label: "Installation" },
		...(usage ? [{ id: "usage", label: "Usage" }] : []),
		...(data.examples.length
			? [
					{ id: "examples", label: "Examples" },
					...data.examples.map((example) => ({
						id: exampleAnchor(example.name),
						label: example.title,
						depth: 2 as const,
						mono: false,
					})),
				]
			: []),
		...(a11y ? [{ id: "accessibility", label: "Keyboard" }] : []),
		...(data.api.length ? [{ id: "api", label: "API reference" }] : []),
		...(data.api.length > 1
			? data.api.map((part) => ({ id: apiAnchor(part.name), label: part.name, depth: 2 as const }))
			: []),
	]);

	const exampleAnchor = (name: string) => `example-${name}`;

	const glyphs: Record<string, string> = {
		ArrowRight: "→",
		ArrowLeft: "←",
		ArrowUp: "↑",
		ArrowDown: "↓",
	};
</script>

<svelte:head
	><title>{entry.title} | heyramzi/ui</title><meta
		name="description"
		content={entry.description}
	/></svelte:head
>

{#snippet key(name: string)}
	<Kbd class="h-6 min-w-6 border border-border bg-card px-1.5 font-mono text-foreground">
		{#if glyphs[name]}<span aria-hidden="true">{glyphs[name]}</span><span class="sr-only"
				>{name.replace("Arrow", "Arrow ")}</span
			>{:else}{name}{/if}
	</Kbd>
{/snippet}

<!-- At least one viewport tall less the nav band, so a short page's pager sits at the bottom. -->
<div class="flex min-h-[calc(100dvh-5rem)] gap-12 pb-10 pt-10">
	<article class="flex min-w-0 max-w-4xl flex-1 flex-col">
		<nav aria-label="Breadcrumb">
			<ol class="flex items-center gap-1.5 text-[13px] text-muted-foreground">
				<li>
					<a href="/{section.id}" class="transition-colors hover:text-foreground">{section.title}</a
					>
				</li>
				<li aria-hidden="true">/</li>
				<li>
					<a
						href="/{section.id}#{categoryId(entry.category)}"
						class="transition-colors hover:text-foreground">{entry.category}</a
					>
				</li>
			</ol>
		</nav>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{entry.title}</h1>
		<p
			class="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
		>
			{entry.description}
		</p>
		<ul class="mt-5 flex flex-wrap gap-2">
			{#each links as link (link.label)}
				<li>
					<a
						href={link.href}
						class="flex h-7 items-center gap-1.5 rounded-(--radius-md) border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-(--duration-quick) hover:border-foreground/20 hover:text-foreground"
					>
						<link.icon class="size-3.5" aria-hidden="true" />
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="mt-8">
			{#key entry.slug}<Viewer {entry} />{/key}
		</div>

		<section aria-labelledby="installation" class="mt-14">
			<DocHeading id="installation">Installation</DocHeading>
			<div class="mt-4">
				<InstallCommand {packages} />
			</div>
		</section>

		{#if usage}
			<section aria-labelledby="usage" class="mt-14">
				<DocHeading id="usage">Usage</DocHeading>
				{#key entry.slug}
					<div class="mt-4">
						<CodeSnippet code={usage} lang="svelte" label="Copy import" />
					</div>
					{#if markup}
						<div class="mt-3">
							<CodeSnippet code={markup} lang="svelte" label="Copy usage" wrap={false} />
						</div>
					{/if}
				{/key}
			</section>
		{/if}

		{#if data.examples.length}
			<section aria-labelledby="examples" class="mt-14">
				<DocHeading id="examples">Examples</DocHeading>
				{#key entry.slug}
					{#each data.examples as example (example.name)}
						<div class="mt-8 first-of-type:mt-5">
							<DocHeading id={exampleAnchor(example.name)} level={3} mono={false}
								>{example.title}</DocHeading
							>
							<p class="mt-1 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
								{example.note}
							</p>
							<div class="mt-4"><ExampleViewer {example} /></div>
						</div>
					{/each}
				{/key}
			</section>
		{/if}

		{#if a11y}
			<section aria-labelledby="accessibility" class="mt-14">
				<DocHeading id="accessibility">Keyboard and accessibility</DocHeading>
				{#if a11y.keys?.length}
					<div class="mt-4 overflow-hidden rounded-(--radius-xl) border border-border">
						<Table.Root class="min-w-0">
							<Table.Header class="border-b border-border bg-muted/40">
								<Table.Row class="hover:bg-transparent">
									<Table.Head class="w-[40%] pl-4 sm:w-[36%]">Key</Table.Head>
									<Table.Head class="pr-4">Does</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each a11y.keys as row (row.keys.join())}
									<Table.Row class="border-b border-border last:border-0">
										<Table.Cell wrap class="py-3 pl-4 align-top">
											<span class="flex flex-wrap items-center gap-1.5">
												{#each row.keys as alt (alt)}
													<span class="flex items-center gap-1">
														{#each alt.split("+") as part, i (part)}
															{#if i}<span aria-hidden="true" class="text-xs text-muted-foreground"
																	>+</span
																>{/if}
															{@render key(part)}
														{/each}
													</span>
												{/each}
											</span>
										</Table.Cell>
										<Table.Cell wrap class="py-3 pr-4 align-top text-sm text-muted-foreground"
											>{row.does}</Table.Cell
										>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
				{#if a11y.notes?.length}
					<ul
						class="mt-5 max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-border"
					>
						{#each a11y.notes as note (note)}<li>{note}</li>{/each}
					</ul>
				{/if}
			</section>
		{/if}

		{#if data.api.length}
			<ComponentApi parts={data.api} />
		{/if}

		<!-- mt-auto takes the slack on a short page, pt-12 is the floor on a long one. -->
		<div class="mt-auto pt-12">
			<nav aria-label="Pager" class="grid grid-cols-2 gap-3 border-t border-border pt-6">
				{#if prev}
					<a
						href="/components/{prev.slug}"
						class="group flex min-w-0 flex-col gap-0.5 rounded-(--radius-xl) border border-border px-4 py-3 transition-[border-color] duration-(--duration-quick) hover:border-foreground/20"
					>
						<span class="flex items-center gap-1 text-xs text-muted-foreground"
							><ArrowLeft
								class="size-3.5 transition-transform duration-(--duration-quick) group-hover:-translate-x-0.5 motion-reduce:transition-none"
								aria-hidden="true"
							/> Previous</span
						>
						<span class="truncate text-sm font-medium">{prev.title}</span>
					</a>
				{:else}<span></span>{/if}
				{#if next}
					<a
						href="/components/{next.slug}"
						class="group flex min-w-0 flex-col items-end gap-0.5 rounded-(--radius-xl) border border-border px-4 py-3 text-right transition-[border-color] duration-(--duration-quick) hover:border-foreground/20"
					>
						<span class="flex items-center gap-1 text-xs text-muted-foreground"
							>Next <ArrowRight
								class="size-3.5 transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
								aria-hidden="true"
							/></span
						>
						<span class="max-w-full truncate text-sm font-medium">{next.title}</span>
					</a>
				{/if}
			</nav>
		</div>
	</article>

	<aside class="hidden w-48 shrink-0 xl:block print:hidden">
		<div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto [scrollbar-width:thin]">
			{#key entry.slug}<OnThisPage items={toc} />{/key}
		</div>
	</aside>
</div>
