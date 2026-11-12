<script lang="ts">
	import { ArrowBendDownLeft, DownloadSimple, FileCode } from "phosphor-svelte";
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import { useHighlightedCode } from "@heyramzi/ui/shadcn/hooks/use-highlighted-code.svelte";
	import { Button } from "@heyramzi/ui/shadcn/button";

	const code = `import { convertToModelMessages, streamText } from "ai"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request }) => {
  const { messages } = await request.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant. Answer in one short paragraph.",
    messages: await convertToModelMessages(messages),
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
				<FileCode aria-hidden="true" />
				src/routes/api/chat/+server.ts
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
					<ArrowBendDownLeft aria-hidden="true" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					icon
					aria-label="Download"
					onclick={() => download(code, "+server.ts")}
				>
					<DownloadSimple aria-hidden="true" />
				</Button>
				<CodeBlock.CopyButton value={code} />
			</CodeBlock.Actions>
		</CodeBlock.Header>
		<CodeBlock.Content {wrap} lineNumbers>
			{#each lines.current as line, index (index)}
				<CodeBlock.Line
					variant={index >= 6 && index <= 10 ? "highlighted" : "default"}
					code={line}
				/>
			{/each}
		</CodeBlock.Content>
	</CodeBlock.Root>
</div>
