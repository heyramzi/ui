<script lang="ts">
	import "#src/app.css";
	import { page } from "$app/state";
	import Nav from "#lib/Nav.svelte";
	import Sidebar from "#lib/Sidebar.svelte";
	import { TooltipProvider } from "@heyramzi/ui/shadcn/tooltip";
	let { children } = $props();

	// The home page and the full-screen slide presenter run without the docs tree.
	const bare = $derived(
		page.url.pathname === "/" || page.url.pathname.startsWith("/slides/presenter"),
	);
</script>

<svelte:head>
	<title>heyramzi/ui | Svelte 5 components and charts</title>
	<meta
		name="description"
		content="Svelte 5 components for our product teams: UI primitives, charts, effects, tasks, agents and slides."
	/>
</svelte:head>

<!-- The provider an app mounts once at its root: the primitives' demos assume one is there. -->
<TooltipProvider>
	<Nav />
	{#if bare}
		<main>{@render children()}</main>
	{:else}
		<div class="mx-auto flex max-w-[88rem] gap-10 px-6">
			<aside
				class="sticky top-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 overflow-y-auto py-10 [scrollbar-width:thin] lg:block print:hidden"
			>
				<Sidebar />
			</aside>
			<main class="min-w-0 flex-1">{@render children()}</main>
		</div>
	{/if}
</TooltipProvider>
<footer
	class="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-8 text-sm text-muted-foreground print:hidden"
>
	<span>Internal component library.</span>
	<a class="hover:text-foreground" href="https://github.com/heyramzi/ui">github.com/heyramzi/ui</a>
</footer>
