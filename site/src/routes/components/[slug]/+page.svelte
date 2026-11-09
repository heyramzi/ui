<script lang="ts">
	import { cards, categoryId } from "#lib/nav.js";
	import { importOf } from "#lib/registry.js";
	import ComponentApi from "#lib/ComponentApi.svelte";
	import Viewer from "#lib/Viewer.svelte";
	import { ArrowLeft, ArrowRight } from "phosphor-svelte";

	let { data } = $props();
	const entry = $derived(data.entry);
	const section = $derived(data.section);
	const index = $derived(cards.findIndex((c) => c.slug === entry.slug));
	const prev = $derived(cards[index - 1]);
	const next = $derived(cards[index + 1]);
	const from = $derived(importOf(entry));
</script>

<svelte:head
	><title>{entry.title} | heyramzi/ui</title><meta
		name="description"
		content={entry.description}
	/></svelte:head
>

<!-- A column at least one viewport tall (less the 5rem nav band), so on a short page the pager
     sits at the bottom of the screen instead of right under the demo. A long page grows past
     it and the pager follows the content as usual. -->
<div class="flex min-h-[calc(100dvh-5rem)] max-w-4xl flex-col pb-10 pt-10">
	<nav aria-label="Breadcrumb">
		<ol class="flex items-center gap-1.5 text-[13px] text-muted-foreground">
			<li>
				<a href="/{section.id}" class="transition-colors hover:text-foreground">{section.title}</a>
			</li>
			<li aria-hidden="true" class="text-muted-foreground/50">/</li>
			<li>
				<a
					href="/{section.id}#{categoryId(entry.category)}"
					class="transition-colors hover:text-foreground">{entry.category}</a
				>
			</li>
		</ol>
	</nav>
	<h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{entry.title}</h1>
	<p class="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
		{entry.description}
	</p>
	{#if from}
		<code
			class="mt-5 self-start rounded-(--radius-md) bg-muted px-2 py-1 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]"
			>{from}</code
		>
	{/if}
	<div class="mt-8">
		{#key entry.slug}<Viewer {entry} />{/key}
	</div>
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
</div>
