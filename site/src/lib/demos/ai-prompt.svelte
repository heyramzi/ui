<script lang="ts">
	import {
		PromptInput,
		PromptInputBody,
		PromptInputTextarea,
		PromptInputToolbar,
		PromptInputSubmit,
		Suggestions,
		Suggestion,
		type PromptInputStatus,
	} from "@heyramzi/ui/ai";

	let status = $state<PromptInputStatus>("ready");
	let value = $state("");

	const ideas = ["Summarize this thread", "Draft a reply"];

	function send(text: string) {
		if (!text.trim()) return;
		value = "";
		status = "submitted";
		setTimeout(() => (status = "streaming"), 400);
		setTimeout(() => (status = "ready"), 2000);
	}
</script>

<div class="flex w-full max-w-md flex-col gap-3">
	<Suggestions>
		{#each ideas as idea (idea)}
			<Suggestion suggestion={idea} onclick={(s) => send(s)} />
		{/each}
	</Suggestions>
	<PromptInput onSubmit={(v) => send(v)}>
		<PromptInputBody>
			<PromptInputTextarea bind:value placeholder="Ask anything..." />
			<PromptInputToolbar>
				<span class="text-xs text-muted-foreground">Enter to send</span>
				<PromptInputSubmit {status} />
			</PromptInputToolbar>
		</PromptInputBody>
	</PromptInput>
</div>
