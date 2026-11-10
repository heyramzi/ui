<script lang="ts">
	import {
		PromptInput,
		PromptInputBody,
		PromptInputTextarea,
		PromptInputToolbar,
		PromptInputSubmit,
		type PromptInputStatus,
	} from "@heyramzi/ui/ai/prompt-input";
	import { Suggestions, Suggestion } from "@heyramzi/ui/ai/suggestion";

	let status = $state<PromptInputStatus>("ready");
	let value = $state("");

	const ideas = ["Summarize this thread", "Draft a reply"];

	let timers: ReturnType<typeof setTimeout>[] = [];

	function send(text: string) {
		if (!text.trim()) return;
		value = "";
		status = "submitted";
		timers = [
			setTimeout(() => (status = "streaming"), 400),
			setTimeout(() => (status = "ready"), 2000),
		];
	}

	function stop() {
		timers.forEach(clearTimeout);
		status = "ready";
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
				<PromptInputSubmit {status} onStop={stop} />
			</PromptInputToolbar>
		</PromptInputBody>
	</PromptInput>
</div>
