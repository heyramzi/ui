<script lang="ts">
	// A span whose `text` shows as a tooltip on hover and on focus. A native title never
	// showed on focus, so the keyboard never reached it.
	import type { Snippet } from "svelte";
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
	import { cn } from "#src/lib/utils.js";

	interface Props {
		/** Left out, the span is plain and takes no focus. */
		text?: string;
		class?: string;
		children: Snippet;
	}

	let { text, class: className, children }: Props = $props();
</script>

{#if text}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<span
					{...props}
					class={cn("rounded-xs outline-none focus-visible:shadow-(--ring-focus)", className)}
				>
					{@render children()}
				</span>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{text}</Tooltip.Content>
	</Tooltip.Root>
{:else}
	<span class={className}>{@render children()}</span>
{/if}
