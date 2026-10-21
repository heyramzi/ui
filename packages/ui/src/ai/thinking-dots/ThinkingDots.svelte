<script lang="ts">
	// =========================
	// IMPORTS
	// =========================

	import { cn } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import TypingDots from "#src/ai/typing-dots/TypingDots.svelte";

	// =========================
	// TYPES
	// =========================

	export interface ThinkingDotsProps extends HTMLAttributes<HTMLDivElement> {
		label?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================

	let { label = "Thinking", class: className, ...rest }: ThinkingDotsProps = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->

<!-- WHY: the dots animation is the shared chat TypingDots primitive; this only
     adds the AI "thinking" label so there is a single source for the dots. -->
<div
	class={cn(
		"inline-flex items-center gap-2 text-sm text-[color:var(--ai-thinking-fg,inherit)]",
		className,
	)}
	role="status"
	{...rest}
>
	{#if label}<span>{label}</span>{/if}
	<TypingDots />
</div>
