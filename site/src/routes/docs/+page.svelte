<script lang="ts">
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";
	import { sections } from "#lib/registry.js";
	import { docBlocks, docsIntro, docsTitle, peers, peersTitle } from "#lib/docs-content.js";

	const blocks = docBlocks.map((b) => ({
		...b,
		steps: b.steps.map((s) => ({
			...s,
			lines: useHighlightedCode(
				() => s.code,
				() => s.lang,
			),
		})),
	}));
</script>

<svelte:head><title>{docsTitle} | heyramzi/ui</title></svelte:head>

<article class="max-w-3xl py-12">
	<h1 class="text-4xl font-semibold tracking-tight">{docsTitle}</h1>
	<p class="mt-4 text-lg text-muted-foreground">{docsIntro}</p>

	<ol class="mt-8 grid gap-2 sm:grid-cols-5">
		{#each sections as s, i (s.id)}
			<li>
				<a
					href="/{s.id}"
					class="flex h-full flex-col gap-1 rounded-xl bg-card p-3 text-sm shadow-card transition-shadow duration-quick ease-smooth-out hover:shadow-card-hover"
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
				<CodeBlock.Root class="rounded-2xl border-0 bg-card shadow-card dark:bg-card">
					<CodeBlock.Content>
						{#each step.lines.current as line, index (index)}<CodeBlock.Line code={line} />{/each}
					</CodeBlock.Content>
				</CodeBlock.Root>
			{/each}
			{#if block.id === "install"}
				<h3 class="mb-3 mt-8 text-sm font-medium">{peersTitle}</h3>
				<dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
					{#each peers as [name, part] (name)}<dt class="font-mono text-xs leading-5">{name}</dt>
						<dd class="text-muted-foreground">{part}</dd>{/each}
				</dl>
			{/if}
		</section>
	{/each}
</article>
