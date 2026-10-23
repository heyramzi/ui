<script lang="ts">
	import { page } from "$app/state";
	import { itemLink, sections } from "#lib/registry.js";

	// The docs tree: Get started, then every section in the order the kit builds up.
	let { onnavigate }: { onnavigate?: () => void } = $props();

	const tree = [
		{
			id: "docs",
			title: "Get started",
			href: "/docs",
			categories: [
				{
					title: "",
					items: [
						{ title: "Introduction", href: "/docs" },
						{ title: "Installation", href: "/docs#install" },
						{ title: "Theming", href: "/docs#theming" },
					],
				},
			],
		},
		...sections.map((s) => ({
			id: s.id,
			title: s.title,
			href: `/${s.id}`,
			categories: s.categories.map((c) => ({ title: c.title, items: c.items.map(itemLink) })),
		})),
	];

	const current = (href: string) => page.url.pathname === href;
</script>

<nav aria-label="Library" class="flex flex-col gap-7 text-[13px]">
	{#each tree as section (section.id)}
		<div>
			<a
				href={section.href}
				class="mb-2 block px-2 text-sm font-semibold {current(section.href)
					? 'text-foreground'
					: 'text-foreground/90 hover:text-foreground'}">{section.title}</a
			>
			{#each section.categories as category (category.title)}
				{#if category.title}
					<p
						class="mb-1 mt-3 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70"
					>
						{category.title}
					</p>
				{/if}
				<ul class="flex flex-col">
					{#each category.items as item (item.href)}
						<li>
							<a
								href={item.href}
								onclick={onnavigate}
								aria-current={current(item.href) ? "page" : undefined}
								class="block rounded-md px-2 py-1 transition-colors {current(item.href)
									? 'bg-muted font-medium text-foreground'
									: 'text-muted-foreground hover:text-foreground'}">{item.title}</a
							>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
	{/each}
</nav>
