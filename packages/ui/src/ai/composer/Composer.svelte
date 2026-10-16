<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface ComposerProps {
		value: string;
		class?: string;
		/** Extra classes for the textarea (e.g. a taller min/max height). */
		inputClass?: string;
		placeholder?: string;
		/** Accent color for the send button and focus ring. Falls back to `--primary`. */
		accent?: string;
		sending?: boolean;
		disabled?: boolean;
		error?: string | null;
		sendLabel?: string;
		/**
		 * Whether the message can be sent. When omitted, falls back to
		 * "has non-empty text".
		 */
		canSend?: boolean;
		onSubmit: () => void;
		inputRef?: HTMLTextAreaElement | null;
		/** Rendered left of the textarea (e.g. an attach button). */
		leading?: Snippet;
		/** Rendered above the input row (e.g. a reply-to banner). */
		header?: Snippet;
		/** Replaces the default spinner shown while sending. */
		busy?: Snippet;
	}
</script>

<script lang="ts">
	import "#src/ai/composer/Composer.css";
	import { cn } from "@heyramzi/utils";
	import { fade } from "svelte/transition";
	import PaperPlaneRight from "phosphor-svelte/lib/PaperPlaneRight";
	import Spinner from "phosphor-svelte/lib/Spinner";

	let {
		value = $bindable(),
		class: className,
		inputClass,
		placeholder = "Write a message...",
		accent,
		sending = false,
		disabled = false,
		error = null,
		sendLabel = "Send message",
		canSend,
		onSubmit,
		inputRef = $bindable(null),
		leading,
		header,
		busy,
	}: ComposerProps = $props();

	// When canSend is not supplied, fall back to "has non-empty text".
	const submittable = $derived(canSend ?? value.trim().length > 0);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSubmit();
		}
	}
</script>

<!-- WHY: visuals are scoped CSS so the composer renders without the consumer's
     Tailwind generating arbitrary classes; theme hooks come from CSS vars. -->
<div class={cn("chat-composer", className)} style:--chat-accent={accent}>
	{@render header?.()}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			onSubmit();
		}}
		class="chat-composer-row"
	>
		{@render leading?.()}

		<textarea
			bind:this={inputRef}
			bind:value
			onkeydown={handleKeydown}
			{placeholder}
			disabled={disabled || sending}
			rows={1}
			class={cn("chat-composer-input", inputClass)}
		></textarea>

		<button
			type="submit"
			disabled={disabled || sending || !submittable}
			class="chat-composer-send"
			aria-label={sendLabel}
		>
			{#if sending && busy}
				{@render busy()}
			{:else if sending}
				<Spinner class="chat-composer-icon chat-composer-spin" />
			{:else}
				<PaperPlaneRight class="chat-composer-icon" />
			{/if}
		</button>
	</form>

	{#if error}
		<p class="chat-composer-error" in:fade={{ duration: 150 }}>{error}</p>
	{/if}
</div>
