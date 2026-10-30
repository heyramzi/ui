<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";
	import { Card } from "#src/shadcn/card/index.js";

	interface Props extends HTMLAttributes<HTMLElement> {
		/** The bottom row: dates, subtasks, time, avatars. */
		meta?: Snippet;
		children: Snippet;
		class?: string;
	}

	let { meta, children, class: className, ...rest }: Props = $props();
</script>

<!-- A white card on a grey well: the title, then a quiet meta row. Depth comes from the card
     step and rises one step on hover, so a held card has somewhere to go. -->
<Card
	{...rest}
	class={cn(
		"gap-2.5 px-3 py-2.5 transition-shadow duration-quick ease-smooth-out hover:shadow-card-hover",
		className,
	)}
>
	<div class="text-sm leading-snug text-pretty">{@render children()}</div>
	{#if meta}
		<div
			class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
		>
			{@render meta()}
		</div>
	{/if}
</Card>
