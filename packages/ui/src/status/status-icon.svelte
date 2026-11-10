<script lang="ts">
	import type { Component } from "svelte";
	import StatusDot from "#src/status/status-dot.svelte";
	import { cn } from "#src/lib/utils.js";
	import { TONE_ICON } from "#src/lib/tone.js";
	import type { Statuses } from "#src/status/status-types.js";

	interface Props {
		statuses: Statuses;
		status: string;
		size?: number;
		animate?: boolean;
		/** Names the icon for a screen reader, like the status word. Leave it out when the word is printed beside it. */
		label?: string;
		class?: string;
	}

	let { statuses, status, size = 14, animate = true, label, class: className }: Props = $props();

	// An icon in the map wins; otherwise the status falls back to its dot.
	let icon = $derived(
		statuses.icon(status) as
			| Component<{ size?: number; class?: string; "aria-hidden"?: boolean | "true" | "false" }>
			| undefined,
	);
	let tone = $derived(statuses.tone(status));
</script>

{#snippet mark()}
	{#if icon}
		{@const Icon = icon}
		<Icon aria-hidden="true" {size} class={cn("shrink-0", TONE_ICON[tone], className)} />
	{:else}
		<StatusDot {statuses} {status} {size} {animate} class={className} />
	{/if}
{/snippet}

<!-- Decorative by default: the status word usually sits beside it. Alone, `label` names it. -->
{#if label}
	<span role="img" aria-label={label} class="inline-flex shrink-0">{@render mark()}</span>
{:else}
	{@render mark()}
{/if}
