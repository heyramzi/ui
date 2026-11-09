<script lang="ts">
	import { page } from "$app/state";
	import ThemeToggle from "@heyramzi/ui/effects/theme-toggle";
	import * as Sheet from "@heyramzi/ui/shadcn/sheet";
	import { GithubLogo, List } from "phosphor-svelte";
	import { sections } from "#lib/registry.js";
	import Sidebar from "#lib/Sidebar.svelte";
	import { version } from "@heyramzi/ui/package.json";
	import { mode, toggleMode } from "@heyramzi/ui/components/theme";
	import SearchPalette from "#lib/SearchPalette.svelte";

	const links = [["/docs", "Docs"], ...sections.map((s) => [`/${s.id}`, s.title])];

	let menuOpen = $state(false);
	// A demo page lives at /components/<slug> whatever its section, so it lights its section's tab.
	const section = $derived(page.data.entry?.section as string | undefined);
	const active = (href: string) =>
		section
			? href === `/${section}`
			: page.url.pathname === href || page.url.pathname.startsWith(href + "/");
</script>

<div class="sticky top-0 z-40 flex justify-center px-4 pt-4">
	<div
		class="flex max-w-full items-center gap-1 rounded-full border border-border bg-background/80 p-1.5 shadow-sm backdrop-blur-xl"
	>
		<Sheet.Root bind:open={menuOpen}>
			<Sheet.Trigger
				class="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
				aria-label="Menu"
			>
				<List class="size-4" aria-hidden="true" />
			</Sheet.Trigger>
			<Sheet.Content side="left" class="w-72 overflow-y-auto p-5">
				<Sheet.Title class="sr-only">Library</Sheet.Title>
				<Sidebar onnavigate={() => (menuOpen = false)} />
			</Sheet.Content>
		</Sheet.Root>
		<a
			href="/"
			class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight"
		>
			<span
				class="grid size-5 place-items-center rounded-md bg-foreground text-[11px] font-bold text-background"
				>h</span
			>
			<span class="hidden sm:inline">heyramzi/ui</span>
		</a>
		<a
			href="https://www.npmjs.com/package/@heyramzi/ui"
			class="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
			>v{version}</a
		>
		<!-- WHY the padding pulled back by a negative margin: the strip scrolls sideways, and a
		     scroller clips its children's box-shadow, so a pill's focus ring drew as two side arcs. -->
		<nav
			aria-label="Sections"
			class="-mx-1 -my-1 hidden min-w-0 items-center overflow-x-auto p-1 text-[13px] [scrollbar-width:none] md:flex"
		>
			{#each links as [href, label] (href)}
				<a
					{href}
					class="whitespace-nowrap rounded-full px-3 py-1.5 transition-colors {active(href)
						? 'bg-foreground/6 font-medium text-foreground'
						: 'text-muted-foreground hover:text-foreground'}">{label}</a
				>
			{/each}
		</nav>
		<SearchPalette />
		<a
			href="https://github.com/heyramzi/ui"
			aria-label="GitHub"
			class="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<GithubLogo weight="fill" class="size-4" aria-hidden="true" />
		</a>
		<ThemeToggle
			isDark={mode.current === "dark"}
			variant="ghost"
			class="rounded-full"
			onToggle={toggleMode}
		/>
	</div>
</div>
