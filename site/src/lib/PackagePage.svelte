<script lang="ts">
	import type { Snippet } from "svelte";

	// A block that needs a whole page to show: the task app, the tour, the deck.
	let {
		title,
		from,
		blurb,
		children,
	}: { title: string; from: string; blurb: string; children: Snippet } = $props();
</script>

<svelte:head
	><title>{title} | heyramzi/ui</title><meta name="description" content={blurb} /></svelte:head
>

<div class="py-12">
	<p class="text-sm text-muted-foreground print:hidden">
		<a href="/blocks" class="hover:text-foreground">Blocks</a>
	</p>
	<h1 class="mt-3 text-4xl font-semibold tracking-tight print:hidden">{title}</h1>
	<p class="mt-2 max-w-2xl text-muted-foreground print:hidden">{blurb}</p>
	<p
		class="mt-4 inline-flex rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs text-muted-foreground print:hidden"
	>
		{from}
	</p>
	<div class="mt-10">{@render children()}</div>
</div>
