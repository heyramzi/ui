<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";
	import { Badge } from "#src/shadcn/badge/index.js";
	import { Spinner } from "#src/shadcn/spinner/index.js";
	import { TONE_COLOR, type Tone } from "#src/lib/tone.js";
	import type { Statuses } from "#src/status/status-types.js";

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "class" | "children"> {
		/** A registry from `defineStatuses`. Supplies the label and tone. */
		statuses?: Statuses;
		/** The status id to look up in `statuses`. Leave it out when you pass `children`. */
		status?: string;
		/** Override the registry label. */
		label?: string;
		/** Override the registry tone. */
		tone?: Tone;
		/** Shows a dot in the tone's colour before the label. */
		dot?: boolean;
		/** Shows a spinner: a background job is still working on the record. */
		busy?: boolean;
		/** Capitalizes the first letter of each word. Turn off for a name or a number. */
		capitalize?: boolean;
		/** The chip's text, for a caller that already has the word. Wins over `label` and the registry. */
		children?: Snippet;
		class?: string;
	}

	let {
		statuses,
		status,
		label,
		tone,
		dot = false,
		busy = false,
		capitalize = true,
		children,
		class: className,
		...restProps
	}: Props = $props();

	let resolvedTone = $derived(tone ?? (statuses && status ? statuses.tone(status) : "neutral"));
	let resolvedLabel = $derived(label ?? (statuses && status ? statuses.label(status) : (status ?? "")));
</script>

<Badge tone={resolvedTone} class={cn(capitalize && "capitalize", className)} {...restProps}>
	{#if dot}
		<span
			class="size-1.5 shrink-0 rounded-full"
			style:background-color={TONE_COLOR[resolvedTone]}
			aria-hidden="true"
		></span>
	{/if}
	{#if busy}
		<Spinner class="size-3" aria-hidden="true" />
	{/if}
	{#if children}
		{@render children()}
	{:else}
		{resolvedLabel}
	{/if}
</Badge>
