<script lang="ts">
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";
	import { sections } from "#lib/registry.js";

	const install = "pnpm add @heyramzi/ui bits-ui";
	const css = `@import "tailwindcss";
@import "@heyramzi/ui/tokens.css";
@import "@heyramzi/ui/design";

/* Tailwind doesn't scan node_modules. Without this, a switch draws as a grey box. */
@source "../node_modules/@heyramzi/ui/src";`;
	const usage = `<script lang="ts">
  import { Button } from "@heyramzi/ui/shadcn/button";
\u003c/script>

<Button>Save changes</Button>`;
	const brand = `// src/lib/brand.ts
import { defineBrand } from "@heyramzi/ui/brand";

export const brand = defineBrand({
  colors: { brand: "oklch(0.51 0.23 277)", brandOnDark: "oklch(0.72 0.16 277)" },
  fonts: { sans: "Geist, system-ui, sans-serif" },
});

// src/hooks.server.ts: the first paint already wears the brand
import { brandStyle } from "@heyramzi/ui/brand";
import { brand } from "$lib/brand";

export const handle = ({ event, resolve }) =>
  resolve(event, { transformPageChunk: ({ html }) => html.replace("<html", \`<html style="\${brandStyle(brand)}"\`) });`;
	const mode = `<script lang="ts">
  import { ThemeProvider } from "@heyramzi/ui/components/theme";
  let { children } = $props();
\u003c/script>

<ThemeProvider />
{@render children()}`;

	const blocks = [
		{
			id: "install",
			title: "Installation",
			steps: [
				{ label: "Add the package", lang: "bash", code: install },
				{ label: "Load the tokens in app.css", lang: "css", code: css },
				{ label: "Import a part by its path", lang: "svelte", code: usage },
			],
		},
		{
			id: "theming",
			title: "Theming",
			steps: [
				{ label: "Name your brand once", lang: "typescript", code: brand },
				{ label: "Mount light and dark once, in the root layout", lang: "svelte", code: mode },
			],
		},
	].map((b) => ({
		...b,
		steps: b.steps.map((s) => ({
			...s,
			lines: useHighlightedCode(
				() => s.code,
				() => s.lang,
			),
		})),
	}));

	const peers = [
		["svelte-sonner", "Toasts"],
		["mode-watcher", "Toasts and the theme provider"],
		["@internationalized/date", "Calendar"],
		["@tabler/icons-svelte-runes", "Trade icons"],
		["@xyflow/svelte", "Canvas"],
	];
</script>

<svelte:head><title>Get started | heyramzi/ui</title></svelte:head>

<article class="max-w-3xl py-12">
	<h1 class="text-4xl font-semibold tracking-tight">Get started</h1>
	<p class="mt-4 text-lg text-muted-foreground">
		One Svelte 5 package for every app we ship: shadcn-svelte primitives, effects, charts, and whole
		blocks like a task board or a slide deck. It all runs on one set of tokens, so a brand colour
		reaches every part.
	</p>

	<ol class="mt-8 grid gap-2 sm:grid-cols-5">
		{#each sections as s, i (s.id)}
			<li>
				<a
					href="/{s.id}"
					class="flex h-full flex-col gap-1 rounded-xl border border-border p-3 text-sm transition-colors hover:border-foreground/30"
					><span class="font-mono text-xs text-muted-foreground">{i + 1}</span>{s.title}</a
				>
			</li>
		{/each}
	</ol>

	{#each blocks as block (block.id)}
		<section id={block.id} class="mt-16 scroll-mt-24">
			<h2 class="text-2xl font-semibold tracking-tight">{block.title}</h2>
			{#each block.steps as step (step.label)}
				<h3 class="mb-3 mt-8 text-sm font-medium">{step.label}</h3>
				<CodeBlock.Root class="rounded-2xl">
					<CodeBlock.Content>
						{#each step.lines.current as line, index (index)}<CodeBlock.Line code={line} />{/each}
					</CodeBlock.Content>
				</CodeBlock.Root>
			{/each}
			{#if block.id === "install"}
				<h3 class="mb-3 mt-8 text-sm font-medium">Add these only for the parts that use them</h3>
				<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
					{#each peers as [name, part] (name)}<dt class="font-mono text-xs leading-5">{name}</dt>
						<dd class="text-muted-foreground">{part}</dd>{/each}
				</dl>
			{/if}
		</section>
	{/each}
</article>
