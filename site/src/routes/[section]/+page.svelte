<script lang="ts">
	import { categoryId } from "#lib/nav.js";
	import Tile from "#lib/Tile.svelte";
	import { ArrowRight } from "phosphor-svelte";

	let { data } = $props();
	const section = $derived(data.section);
	const count = $derived(section.categories.reduce((n, c) => n + c.items.length, 0));
</script>

<svelte:head><title>{section.title} | heyramzi/ui</title></svelte:head>

<div class="pb-16 pt-10">
	<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{section.title}</h1>
	<p class="mt-2 text-sm text-muted-foreground tabular-nums">{count} parts</p>

	{#each section.categories as category (category.title)}
		<section class="mt-12" aria-labelledby={categoryId(category.title)}>
			<h2
				id={categoryId(category.title)}
				class="mb-4 scroll-mt-24 text-base font-semibold tracking-tight"
			>
				{category.title}
			</h2>
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each category.items as item (typeof item === "string" ? item : item.href)}
					{#if typeof item === "string"}
						<Tile entry={data.demos[item]} />
					{:else}
						<a
							href={item.href}
							class="group flex min-h-24 items-center justify-between rounded-(--radius-xl) border border-dashed border-border px-4 py-3.5 text-sm font-medium transition-[border-color] duration-(--duration-quick) hover:border-foreground/20"
						>
							{item.title}
							<ArrowRight
								class="size-4 text-muted-foreground transition-transform duration-(--duration-quick) group-hover:translate-x-0.5 motion-reduce:transition-none"
								aria-hidden="true"
							/>
						</a>
					{/if}
				{/each}
			</div>
		</section>
	{/each}
</div>
