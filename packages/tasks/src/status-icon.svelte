<script lang="ts">
	import type { Component } from "svelte";
	import StatusDot from "#src/status-dot.svelte";
	import { cn } from "@heyramzi/utils";
	import { TONE_ICON } from "@heyramzi/ui/lib/tone.js";
	import type { Statuses } from "#src/status-types.js";

	interface Props {
		statuses: Statuses;
		status: string;
		size?: number;
		animate?: boolean;
		class?: string;
	};

	let { statuses, status, size = 14, animate = true, class: className }: Props = $props();

	// An icon in the map wins; otherwise the status falls back to its dot.
	let icon = $derived(
		statuses.icon(status) as Component<{ size?: number; class?: string }> | undefined,
	);
	let tone = $derived(statuses.tone(status));
</script>

{#if icon}
	{@const Icon = icon}
	<Icon {size} class={cn("shrink-0", TONE_ICON[tone], className)} />
{:else}
	<StatusDot {statuses} {status} {size} {animate} class={className} />
{/if}
