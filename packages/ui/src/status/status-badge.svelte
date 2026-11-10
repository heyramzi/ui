<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";
	import StatusPill from "#src/status/status-pill.svelte";
	import StatusIcon from "#src/status/status-icon.svelte";
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
		/** What a screen reader hears after the label while `busy`, since the spinner is hidden. */
		busyLabel?: string;
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
		busyLabel = "working",
		capitalize = true,
		children,
		class: className,
		...restProps
	}: Props = $props();

	let resolvedTone = $derived(tone ?? (statuses && status ? statuses.tone(status) : "neutral"));
	let resolvedLabel = $derived(
		label ?? (statuses && status ? statuses.label(status) : (status ?? "")),
	);
	// Every registry status: StatusIcon draws the variant's shape when the map has none (DESIGN.md, Patterns).
	let hasIcon = $derived(Boolean(statuses && status && statuses.has(status)));
</script>

<!-- The pill draws the tint; this picks what goes before the label. A registry icon wins,
     so the state reads without its colour. -->
{#snippet lead()}
	{#if busy}
		<Spinner class="size-3" aria-hidden="true" />
	{:else if hasIcon && statuses && status}
		<StatusIcon {statuses} {status} size={12} animate={false} />
	{:else if dot}
		<span
			class="size-1.5 shrink-0 rounded-full"
			style:background-color={TONE_COLOR[resolvedTone]}
			aria-hidden="true"
		></span>
	{/if}
{/snippet}

<StatusPill
	tone={resolvedTone}
	icon={busy || hasIcon || dot ? lead : undefined}
	class={cn(capitalize && "capitalize", className)}
	{...restProps}
>
	<!-- One line: a break before the busy note would read as a space before its comma. -->
	{#if children}{@render children()}{:else}{resolvedLabel}{/if}{#if busy}<span class="sr-only"
			>, {busyLabel}</span
		>{/if}
</StatusPill>
