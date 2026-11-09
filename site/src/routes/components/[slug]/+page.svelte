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

<div class="py-12">
	<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
		<a href="/{section.id}" class="hover:text-foreground">{section.title}</a>
		<span aria-hidden="true">/</span>
		<a href="/{section.id}#{categoryId(entry.category)}" class="hover:text-foreground"
			>{entry.category}</a
		>
	</p>
	<h1 class="mt-3 text-4xl font-semibold tracking-tight">{entry.title}</h1>
	<p class="mt-2 max-w-2xl text-muted-foreground">{entry.description}</p>
	{#if from}
		<p
			class="mt-4 inline-flex rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs text-muted-foreground"
		>
			{from}
		</p>
	{/if}
	<div class="mt-8">
		{#key entry.slug}<Viewer {entry} />{/key}
	</div>
	{#if data.api.length}
		<ComponentApi parts={data.api} />
	{/if}

	<nav aria-label="Pager" class="mt-12 grid grid-cols-2 gap-4">
		{#if prev}
			<a
				href="/components/{prev.slug}"
				class="group flex flex-col gap-1 rounded-2xl border border-border p-4 transition-colors hover:border-foreground/30"
			>
				<span class="flex items-center gap-1 text-xs text-muted-foreground"
					><ArrowLeft class="size-3.5" aria-hidden="true" /> Previous</span
				>
				<span class="text-sm font-medium">{prev.title}</span>
			</a>
		{:else}<span></span>{/if}
		{#if next}
			<a
				href="/components/{next.slug}"
				class="group flex flex-col items-end gap-1 rounded-2xl border border-border p-4 text-right transition-colors hover:border-foreground/30"
			>
				<span class="flex items-center gap-1 text-xs text-muted-foreground"
					>Next <ArrowRight class="size-3.5" aria-hidden="true" /></span
				>
				<span class="text-sm font-medium">{next.title}</span>
			</a>
		{/if}
	</nav>
</div>
