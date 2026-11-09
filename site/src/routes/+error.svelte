<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "@heyramzi/ui/shadcn/button";

	const missing = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{missing ? "Page not found" : "Something broke"} | heyramzi/ui</title>
</svelte:head>

<div class="flex min-h-[60dvh] max-w-4xl flex-col justify-center py-16">
	<p class="font-mono text-sm text-muted-foreground">{page.status}</p>
	<h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
		{missing ? "This page isn't here." : "This page didn't load."}
	</h1>
	<p class="mt-3 text-base text-muted-foreground sm:text-lg">
		{missing
			? "The part may have been renamed or removed. Search finds it if it still exists."
			: (page.error?.message ?? "Try again in a moment.")}
	</p>
	<div class="mt-6 flex flex-wrap gap-2">
		<Button href="/components">Browse all parts</Button>
		<Button href="/" variant="outline">Home</Button>
	</div>
</div>
