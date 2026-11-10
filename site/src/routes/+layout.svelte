<script lang="ts">
	import "#src/app.css";
	import { page } from "$app/state";
	import Nav from "#lib/Nav.svelte";
	import Sidebar from "#lib/Sidebar.svelte";
	import { TooltipProvider } from "@heyramzi/ui/shadcn/tooltip";
	import { Toaster } from "@heyramzi/ui/shadcn/sonner";
	import { ThemeProvider } from "@heyramzi/ui/components/theme";
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

<!-- Follows the system until someone picks. "theme" is the key the site stored before, so an
     old choice still holds. -->
<ThemeProvider modeStorageKey="theme" />

<a
	href="#content"
	class="fixed top-3 left-3 z-50 -translate-y-[200%] rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background shadow-(--elev-raised) focus-visible:translate-y-0"
	>Skip to content</a
>

<!-- The providers an app mounts once at its root: the primitives' demos assume they're there. -->
<Toaster />
<TooltipProvider>
	<Nav />
	{#if bare}
		<main id="content" tabindex="-1" class="outline-none">{@render children()}</main>
	{:else}
		<div class="mx-auto flex max-w-[88rem] gap-10 px-6">
			<aside
				class="sticky top-20 hidden h-[calc(100dvh-5rem)] w-56 shrink-0 overflow-y-auto py-10 [scrollbar-width:thin] lg:block print:hidden"
			>
				<Sidebar />
			</aside>
			<main id="content" tabindex="-1" class="min-w-0 flex-1 outline-none">
				{@render children()}
			</main>
		</div>
	{/if}
</TooltipProvider>
<footer
	class="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-8 text-sm text-muted-foreground print:hidden"
>
	<span>An MIT library on Bits UI and Tailwind.</span>
	<nav aria-label="Footer" class="flex items-center gap-5">
		<a class="transition-colors hover:text-foreground" href="/docs">Docs</a>
		<a class="transition-colors hover:text-foreground" href="/changelog">Changelog</a>
		<a class="transition-colors hover:text-foreground" href="https://github.com/heyramzi/ui"
			>GitHub</a
		>
	</nav>
</footer>
