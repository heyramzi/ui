<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { CopyButton } from "@heyramzi/ui/components/copy";

	// A short block with a copy button. With `lang`, it highlights once it scrolls into view.
	let {
		code,
		lang,
		label,
		header,
		wrap = true,
	}: { code: string; lang?: string; label: string; header?: Snippet; wrap?: boolean } = $props();

	let box = $state<HTMLElement | null>(null);
	let Lines = $state<Component<{ code: string; lang: string }> | null>(null);

	$effect(() => {
		if (!lang || !box || Lines) return;
		const seen = new IntersectionObserver((hits) => {
			if (!hits.some((hit) => hit.isIntersecting)) return;
			seen.disconnect();
			void import("#lib/HighlightedLines.svelte").then((mod) => (Lines = mod.default));
		});
		seen.observe(box);
		return () => seen.disconnect();
	});
</script>

<div bind:this={box} class="overflow-hidden rounded-(--radius-xl) border border-border bg-card">
	{#if header}
		<div class="flex h-11 items-center border-b border-border bg-muted/40 px-1.5">
			{@render header()}
		</div>
	{/if}
	<div class="relative">
		<CodeBlock.Root class="rounded-none border-0 bg-transparent dark:bg-transparent">
			<CodeBlock.Content {wrap} class="max-h-80 py-3.5 pr-14 text-[13px]">
				{#if Lines && lang}<Lines {code} {lang} />{:else}{code}{/if}
			</CodeBlock.Content>
		</CodeBlock.Root>
		<CopyButton value={code} {label} size="md" class="absolute right-2 top-2" />
	</div>
</div>
