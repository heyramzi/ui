<script lang="ts">
	import { ArrowBendDownLeft, DownloadSimple, FileCode } from "phosphor-svelte";
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";
	import { Button } from "@heyramzi/ui/shadcn/button";

	const code = `import { streamText } from "ai"

export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant. Answer in one short paragraph.",
    messages,
  })

  return result.toUIMessageStreamResponse()
}`;

	function download(value: string, filename: string) {
		const url = URL.createObjectURL(new Blob([value], { type: "text/plain" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	let wrap = $state(false);

	const lines = useHighlightedCode(
		() => code,
		() => "ts"
	);
</script>

<div class="w-full max-w-lg">
	<CodeBlock.Root>
		<CodeBlock.Header>
			<CodeBlock.Title>
				<FileCode />
				app/api/chat/route.ts
			</CodeBlock.Title>
			<CodeBlock.Actions>
				<Button
					variant="ghost"
					size="sm"
					icon
					aria-label="Wrap lines"
					aria-pressed={wrap}
					class="aria-pressed:text-foreground"
					onclick={() => (wrap = !wrap)}
				>
					<ArrowBendDownLeft />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					icon
					aria-label="Download"
					onclick={() => download(code, "route.ts")}
				>
					<DownloadSimple />
				</Button>
				<CodeBlock.CopyButton value={code} />
			</CodeBlock.Actions>
		</CodeBlock.Header>
		<CodeBlock.Content {wrap} lineNumbers>
			{#each lines.current as line, index (index)}
				<CodeBlock.Line
					variant={index >= 5 && index <= 9 ? "highlighted" : "default"}
					code={line}
				/>
			{/each}
		</CodeBlock.Content>
	</CodeBlock.Root>
</div>
