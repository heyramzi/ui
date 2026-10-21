<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	export interface TypingDotsProps extends HTMLAttributes<HTMLSpanElement> {
		/** Dot diameter in px. */
		size?: number;
		class?: string;
	}
</script>

<script lang="ts">
	import "#src/ai/typing-dots/TypingDots.css";
	import { cn } from "#src/lib/utils.js";

	let { size = 4, class: className, ...rest }: TypingDotsProps = $props();
</script>

<span
	class={cn("typing-dots", className)}
	style:--typing-dot-size="{size}px"
	aria-hidden="true"
	{...rest}
>
	<span class="typing-dot"></span>
	<span class="typing-dot"></span>
	<span class="typing-dot"></span>
</span>
