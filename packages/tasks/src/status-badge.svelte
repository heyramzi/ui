<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "./lib/cn.js";
	import { TONE_CLASS } from "./tone.js";
	import type { Tone, Statuses } from "./status-types.js";
	import spinnerIcon from "./icons/spinner.svg?raw";

	type Props = {
		/** A registry from `defineStatuses`. Supplies the label and tone. */
		statuses?: Statuses;
		/** The status id to look up in `statuses`. Leave it out when you pass `children`. */
		status?: string;
		/** Override the registry label. */
		label?: string;
		/** Override the registry tone. */
		tone?: Tone;
		/** Shows a spinner: a background job is still working on the record. */
		busy?: boolean;
		/** Capitalizes the first letter of each word. Turn off for a name or a number. */
		capitalize?: boolean;
		/** The chip's text, for a caller that already has the word. Wins over `label` and the registry. */
		children?: Snippet;
		class?: string;
	};

	let {
		statuses,
		status,
		label,
		tone,
		busy = false,
		capitalize = true,
		children,
		class: className,
	}: Props = $props();

	let resolvedTone = $derived(tone ?? (statuses && status ? statuses.tone(status) : "neutral"));
	let resolvedLabel = $derived(label ?? (statuses && status ? statuses.label(status) : (status ?? "")));
</script>

<span
	class={cn(
		"inline-flex h-5 shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
		capitalize && "capitalize",
		TONE_CLASS[resolvedTone],
		className,
	)}
>
	{#if busy}
		<span class="size-3 animate-spin [&>svg]:size-full" aria-hidden="true">{@html spinnerIcon}</span>
	{/if}
	{#if children}
		{@render children()}
	{:else}
		{resolvedLabel}
	{/if}
</span>
