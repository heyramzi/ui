<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface ConversationContentProps extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { onDestroy } from "svelte";
	import { getStickToBottomContext } from "#src/ai/conversation/stick-to-bottom-context.svelte.js";

	let { class: className, children, ...rest }: ConversationContentProps = $props();

	const context = getStickToBottomContext();
	let element = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (element) {
			context.setElement(element);
			context.scrollToBottom("smooth");
		}
	});

	onDestroy(() => {
		context.destroy();
	});
</script>

<div bind:this={element} class={cn("flex-1 overflow-y-auto", className)} {...rest}>
	{@render children?.()}
</div>
