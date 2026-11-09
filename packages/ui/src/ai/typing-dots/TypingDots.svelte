<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	export interface TypingDotsProps extends HTMLAttributes<HTMLElement> {
		/** Dot diameter in px. */
		size?: number;
		/** Set, even to "", the dots become a `role="status"` line; the text shows when non-empty. */
		label?: string;
		class?: string;
	}
</script>

<script lang="ts">
	import "#src/ai/typing-dots/TypingDots.css";
	import { cn } from "#src/lib/utils.js";

	let { size = 4, label, class: className, ...rest }: TypingDotsProps = $props();
</script>

{#snippet dots(extra?: HTMLAttributes<HTMLElement>, dotsClass?: string)}
	<span
		class={cn("typing-dots", dotsClass)}
		style:--typing-dot-size="{size}px"
		aria-hidden="true"
		{...extra}
	>
		<span class="typing-dot"></span>
		<span class="typing-dot"></span>
		<span class="typing-dot"></span>
	</span>
{/snippet}

{#if label === undefined}
	{@render dots(rest, className)}
{:else}
	<div
		class={cn(
			"inline-flex items-center gap-2 text-sm text-[color:var(--ai-thinking-fg,inherit)]",
			className,
		)}
		role="status"
		{...rest}
	>
		{#if label}<span>{label}</span>{/if}
		{@render dots()}
	</div>
{/if}
