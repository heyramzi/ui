<script lang="ts">
	import { cn } from "./lib/cn.js";
	import { TONE_CLASS } from "./tone.js";
	import type { Tone, Statuses } from "./status-types.js";
	import spinnerIcon from "./icons/spinner.svg?raw";

	type Props = {
		/** A registry from `defineStatuses`. Supplies the label and tone. */
		statuses?: Statuses;
		status: string;
		/** Override the registry label. */
		label?: string;
		/** Override the registry tone. */
		tone?: Tone;
		/** Shows a spinner: a background job is still working on the record. */
		busy?: boolean;
		class?: string;
	};

	let {
		statuses,
		status,
		label,
		tone,
		busy = false,
		class: className,
	}: Props = $props();

	let resolvedTone = $derived(tone ?? (statuses ? statuses.tone(status) : "neutral"));
	let resolvedLabel = $derived(label ?? (statuses ? statuses.label(status) : status));
</script>

<span
	class={cn(
		"inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
		TONE_CLASS[resolvedTone],
		className,
	)}
>
	{#if busy}
		<span class="size-3 animate-spin [&>svg]:size-full" aria-hidden="true">{@html spinnerIcon}</span>
	{/if}
	{resolvedLabel}
</span>
