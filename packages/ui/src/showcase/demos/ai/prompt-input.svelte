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
	} from "#src/ai/index.js";

	let status = $state<PromptInputStatus>("ready");
	let value = $state("");

	// Two, not three: the stage is half the section now, and the third chip ran
	// past the card edge into a sideways scroll.
	const ideas = ["Summarize this thread", "Draft a reply"];

	function send(text: string) {
		if (!text.trim()) return;
		value = "";
		status = "submitted";
		setTimeout(() => (status = "streaming"), 400);
		setTimeout(() => (status = "ready"), 2000);
	}
</script>

<div class="stack">
	<Suggestions>
		{#each ideas as idea (idea)}
			<Suggestion suggestion={idea} onclick={(s) => send(s)} />
		{/each}
	</Suggestions>
	<PromptInput onSubmit={(v) => send(v)}>
		<PromptInputBody>
			<PromptInputTextarea bind:value placeholder="Ask anything..." />
			<PromptInputToolbar>
				<span class="hint">Enter to send</span>
				<PromptInputSubmit {status} />
			</PromptInputToolbar>
		</PromptInputBody>
	</PromptInput>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
</style>
