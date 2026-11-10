<script lang="ts">
	import { goto } from "$app/navigation";
	import * as Command from "@heyramzi/ui/shadcn/command";
	import { Kbd } from "@heyramzi/ui/shadcn/kbd";
	import { ArrowRight, BookOpen, MagnifyingGlass, SquaresFour } from "phosphor-svelte";
	import { itemLink, sections } from "#lib/nav.js";

	// The site's own index: the docs pages, then each section and every page it places.
	type Row = { title: string; href: string; hint: string; keywords: string[] };
	type Group = { id: string; heading: string; rows: Row[] };

	const groups: Group[] = [
		{
			id: "docs",
			heading: "Get started",
			rows: [
				{ title: "Introduction", href: "/docs", hint: "Docs", keywords: ["start", "overview"] },
				{ title: "Installation", href: "/docs#install", hint: "Docs", keywords: ["pnpm", "setup"] },
				{ title: "Theming", href: "/docs#theming", hint: "Docs", keywords: ["brand", "dark"] },
				{ title: "Changelog", href: "/changelog", hint: "Docs", keywords: ["release", "version"] },
			],
		},
		...sections.map((s) => ({
			id: s.id,
			heading: s.title,
			rows: [
				{ title: s.title, href: `/${s.id}`, hint: "Section", keywords: [] },
				...s.categories.flatMap((c) =>
					c.items.map((item) => {
						const slug = typeof item === "string" ? [item] : [];
						return { ...itemLink(item), hint: c.title, keywords: [s.title, c.title, ...slug] };
					}),
				),
			],
		})),
	];

	let open = $state(false);
	let query = $state("");
	let trigger = $state<HTMLButtonElement | null>(null);
	let mac = $state(true);

	$effect(() => {
		mac = /Mac|iPhone|iPad/.test(navigator.userAgent);
	});

	// Closing hands focus back to the trigger, whichever key opened the palette. Two frames let
	// the dialog's own focus restore run first.
	let wasOpen = false;
	$effect(() => {
		if (open) {
			wasOpen = true;
			return;
		}
		if (!wasOpen) return;
		wasOpen = false;
		query = "";
		requestAnimationFrame(() => requestAnimationFrame(() => trigger?.focus()));
	});

	// Every word must appear in the row's own words, and a title hit outranks a section or
	// category hit. The default fuzzy scorer read "bar chart" into "interactive hover button".
	function filter(_value: string, search: string, keywords: string[] = []) {
		const words = search.toLowerCase().split(/\s+/).filter(Boolean);
		const [title = "", ...rest] = keywords.map((k) => k.toLowerCase());
		const hay = `${title} ${rest.join(" ")}`;
		if (!words.every((w) => hay.includes(w))) return 0;
		const phrase = words.join(" ");
		if (title.startsWith(phrase)) return 1;
		if (title.includes(phrase)) return 0.8;
		return words.every((w) => title.includes(w)) ? 0.6 : 0.3;
	}

	const typing = (target: EventTarget | null) =>
		target instanceof HTMLElement &&
		(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

	function onkeydown(event: KeyboardEvent) {
		// A focused component that used the key, like an editor's Cmd+K link, keeps it.
		if (event.defaultPrevented) return;
		if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			open = !open;
		} else if (event.key === "/" && !open && !typing(event.target)) {
			event.preventDefault();
			open = true;
		}
	}

	async function select(href: string) {
		open = false;
		await goto(href);
		// A navigation moves focus to the top of the new page, so the trigger takes it back after.
		trigger?.focus();
	}
</script>

<svelte:window {onkeydown} />

<button
	bind:this={trigger}
	type="button"
	onclick={() => (open = true)}
	aria-label="Search"
	aria-keyshortcuts={mac ? "Meta+K /" : "Control+K /"}
	class="flex h-8 items-center gap-2 rounded-full px-2 text-[13px] text-muted-foreground transition-colors duration-quick ease-smooth-out hover:bg-foreground/8 hover:text-foreground sm:bg-foreground/5 sm:pr-1.5 sm:pl-2.5"
>
	<MagnifyingGlass class="size-4" aria-hidden="true" />
	<span class="hidden sm:inline">Search</span>
	<Kbd class="hidden bg-background/80 sm:inline-flex" aria-hidden="true">{mac ? "⌘" : "Ctrl"} K</Kbd
	>
</button>

<Command.Dialog
	bind:open
	title="Search the docs"
	description="Find a component, section or page."
	loop
	{filter}
>
	<Command.Input size="lg" placeholder="Search components and pages" bind:value={query}>
		{#snippet trailing()}
			<Kbd class="hidden sm:inline-flex">Esc</Kbd>
		{/snippet}
	</Command.Input>
	<Command.List class="max-h-[min(24rem,56svh)] scroll-py-2 p-1.5">
		<Command.Empty class="flex flex-col items-center gap-1 py-10">
			<span class="font-medium text-foreground">No results for "{query}"</span>
			<span class="text-muted-foreground">Try a component name, like button or chart.</span>
		</Command.Empty>
		{#each groups as group (group.id)}
			<Command.Group heading={group.heading}>
				{#each group.rows as row (row.title + row.href)}
					<Command.Item
						value={`${group.id}:${row.title}:${row.href}`}
						keywords={[row.title, ...row.keywords]}
						onSelect={() => select(row.href)}
					>
						{#if row.hint === "Section"}
							<SquaresFour class="text-muted-foreground" aria-hidden="true" />
						{:else if group.id === "docs"}
							<BookOpen class="text-muted-foreground" aria-hidden="true" />
						{:else}
							<ArrowRight class="text-muted-foreground/60" aria-hidden="true" />
						{/if}
						<span class="truncate">{row.title}</span>
						<span class="ml-auto shrink-0 pl-4 text-xs text-muted-foreground">{row.hint}</span>
					</Command.Item>
				{/each}
			</Command.Group>
		{/each}
	</Command.List>
	<div
		class="hidden items-center gap-4 border-t border-border/70 px-4 py-2.5 text-xs text-muted-foreground sm:flex"
	>
		<span class="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> Move</span>
		<span class="flex items-center gap-1.5"><Kbd>↵</Kbd> Open</span>
		<span class="flex items-center gap-1.5"><Kbd>Esc</Kbd> Close</span>
	</div>
</Command.Dialog>
