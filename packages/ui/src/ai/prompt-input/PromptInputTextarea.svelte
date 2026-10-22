<script lang="ts" module>
	import type { HTMLTextareaAttributes } from "svelte/elements";

	export interface PromptInputTextareaProps extends Omit<
		HTMLTextareaAttributes,
		"value" | "name" | "onkeydown"
	> {
		value?: string;
		name?: string;
		class?: string;
		/** WHY: opt-out of "Enter submits, Shift+Enter newline" if the consumer
		 *  prefers explicit Cmd/Ctrl+Enter only. */
		enterSubmits?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";

	let {
		class: className,
		value = $bindable(""),
		name = "message",
		placeholder = "Ask anything",
		enterSubmits = true,
		...rest
	}: PromptInputTextareaProps = $props();

	function handleKeyDown(event: KeyboardEvent) {
		// WHY: Cmd/Ctrl+Enter always submits regardless of `enterSubmits`. Power
		// users expect this even when plain Enter inserts a newline.
		if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
			event.preventDefault();
			requestSubmit(event);
			return;
		}

		if (!enterSubmits) return;
		if (event.key !== "Enter") return;
		if (event.isComposing) return;
		if (event.shiftKey) return;

		event.preventDefault();
		requestSubmit(event);
	}

	function requestSubmit(event: KeyboardEvent) {
		const form = (event.currentTarget as HTMLTextAreaElement).form;
		if (!form) return;
		const submit =
			form.querySelector<HTMLButtonElement>("[data-prompt-input-submit]") ??
			form.querySelector<HTMLButtonElement>('button[type="submit"]');
		if (submit?.disabled) return;
		if (submit) {
			form.requestSubmit(submit);
		} else {
			form.requestSubmit();
		}
	}
</script>

<textarea
	class={cn(
		"field-sizing-content max-h-48 min-h-10 w-full resize-none border-0 bg-transparent p-3 text-sm outline-none",
		"placeholder:text-[color:var(--muted-foreground,inherit)]",
		"focus-visible:ring-0",
		className,
	)}
	{name}
	bind:value
	onkeydown={handleKeyDown}
	{placeholder}
	{...rest}></textarea>
