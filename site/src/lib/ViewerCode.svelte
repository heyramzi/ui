<script lang="ts">
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";

	// Mounted only when the Code tab opens, so the highlighter and its grammars load then.
	let { source, height = 240 }: { source: string; height?: number } = $props();

	const lines = useHighlightedCode(
		() => source,
		() => "svelte",
	);
</script>

<CodeBlock.Root class="rounded-none border-0">
	<CodeBlock.Content class="max-h-[560px]" style="min-height:{Math.min(height, 320)}px">
		{#each lines.current as line, index (index)}
			<CodeBlock.Line code={line} />
		{/each}
	</CodeBlock.Content>
</CodeBlock.Root>
