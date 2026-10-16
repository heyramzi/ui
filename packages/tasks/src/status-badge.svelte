<script lang="ts">
	import { cn } from "./lib/cn.js";
	import { TONE_CLASS } from "./tone.js";
	import type { Tone, Statuses } from "./status-types.js";

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
		<svg class="size-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25"></circle>
			<path
				d="M21 12a9 9 0 0 0-9-9"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
			></path>
		</svg>
	{/if}
	{resolvedLabel}
</span>
