<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface ConversationProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { setStickToBottomContext } from "#src/ai/conversation/stick-to-bottom-context.svelte.js";

	let { class: className, children, ...rest }: ConversationProps = $props();

	setStickToBottomContext();
</script>

<div
	class={cn("relative flex h-full flex-col overflow-hidden", className)}
	role="log"
	aria-live="polite"
	aria-atomic="false"
	{...rest}
>
	{@render children?.()}
</div>
