<script lang="ts">
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";

	// Imported on demand by CodeSnippet, so shiki stays out of a page's first load.
	let { code, lang }: { code: string; lang: string } = $props();

	const lines = useHighlightedCode(
		() => code,
		() => lang,
	);
</script>

{#each lines.current as line, index (index)}
	<CodeBlock.Line code={line} />
{/each}
