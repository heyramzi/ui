<script lang="ts">
	import Demo from "@heyramzi/ui/slides/demo.svelte";
	import { slidesAsData, slidesAsMarkup } from "#lib/slides-examples.js";
	import PackagePage from "#lib/PackagePage.svelte";
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";

	const examples = [
		{
			title: "Write slides",
			lines: useHighlightedCode(
				() => slidesAsMarkup,
				() => "svelte",
			),
		},
		{
			title: "Or write data",
			lines: useHighlightedCode(
				() => slidesAsData,
				() => "typescript",
			),
		},
	];
</script>

<PackagePage
	title="Deck and presenter"
	from="@heyramzi/ui/slides"
	blurb="Decks on a fixed canvas that scales to any screen. Press O for the overview."
>
	<Demo presenter="/slides/presenter" />

	<div class="mt-16 grid gap-6 lg:grid-cols-2 print:hidden">
		{#each examples as example (example.title)}
			<div class="min-w-0">
				<h2 class="mb-3 text-lg font-semibold tracking-tight">{example.title}</h2>
				<CodeBlock.Root class="rounded-2xl">
					<CodeBlock.Content>
						{#each example.lines.current as line, index (index)}
							<CodeBlock.Line code={line} />
						{/each}
					</CodeBlock.Content>
				</CodeBlock.Root>
			</div>
		{/each}
	</div>
</PackagePage>

<style>
	/* Print the deck and nothing else: no nav, footer, page padding or margins. */
	@media print {
		:global(body:has(.demo) .sticky),
		:global(body:has(.demo) footer) {
			display: none !important;
		}
		:global(body:has(.demo) main > div) {
			max-width: none !important;
			padding: 0 !important;
		}
		:global(body:has(.demo) main > div > div) {
			margin: 0 !important;
		}
	}
</style>
