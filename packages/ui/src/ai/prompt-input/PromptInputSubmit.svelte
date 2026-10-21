<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { ButtonProps, ButtonSize, ButtonVariant } from "#src/shadcn/button/index.js";

	export type PromptInputStatus = "ready" | "submitted" | "streaming" | "error";

	export interface PromptInputSubmitProps extends Omit<ButtonProps, "type" | "onclick"> {
		status?: PromptInputStatus;
		onStop?: () => void;
		onclick?: (event: MouseEvent) => void;
		/** Accessible name while idle. Translate at the call site. */
		submitLabel?: string;
		/** Accessible name while generating, when a click stops the run. */
		stopLabel?: string;
		class?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Spinner } from "#src/shadcn/spinner/index.js";
	import SendIcon from "phosphor-svelte/lib/PaperPlaneRight";
	import SquareIcon from "phosphor-svelte/lib/Square";
	import XIcon from "phosphor-svelte/lib/X";

	let {
		status = "ready",
		onStop,
		onclick,
		submitLabel = "Submit",
		stopLabel = "Stop",
		variant = "default",
		size = "default",
		icon = true,
		class: className,
		children,
		...rest
	}: PromptInputSubmitProps = $props();

	const isGenerating = $derived(status === "submitted" || status === "streaming");
	const buttonType = $derived<"button" | "submit">(isGenerating ? "button" : "submit");

	function handleClick(event: MouseEvent) {
		if (isGenerating) {
			event.preventDefault();
			onStop?.();
			return;
		}
		onclick?.(event);
	}
</script>

<Button
	{...rest}
	{variant}
	{size}
	{icon}
	type={buttonType}
	data-prompt-input-submit
	onclick={handleClick}
	aria-label={isGenerating ? stopLabel : submitLabel}
	class={cn("gap-1.5", className)}
>
	{#if children}
		{@render children()}
	{:else if status === "submitted"}
		<Spinner />
	{:else if status === "streaming"}
		<SquareIcon class="size-4" />
	{:else if status === "error"}
		<XIcon class="size-4" />
	{:else}
		<SendIcon class="size-4" />
	{/if}
</Button>
