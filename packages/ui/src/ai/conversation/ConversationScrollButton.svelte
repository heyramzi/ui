<script lang="ts" module>
	import type { ButtonProps } from "#src/shadcn/button/index.js";

	export interface ConversationScrollButtonProps extends Omit<ButtonProps, "onclick"> {
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { Button } from "#src/shadcn/button/index.js";
	import ArrowDown from "phosphor-svelte/lib/ArrowDown";
	import { fly } from "svelte/transition";
	import { backOut } from "svelte/easing";
	import { getStickToBottomContext } from "#src/ai/conversation/stick-to-bottom-context.svelte.js";

	let { class: className, onclick, ...rest }: ConversationScrollButtonProps = $props();

	const context = getStickToBottomContext();

	function handleClick(event: MouseEvent) {
		context.scrollToBottom();
		onclick?.(event);
	}
</script>

{#if !context.isAtBottom}
	<div
		in:fly={{ duration: 300, y: 10, easing: backOut }}
		out:fly={{ duration: 200, y: 10, easing: backOut }}
		class="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2"
	>
		<Button
			class={cn(
				"rounded-full shadow-lg backdrop-blur-sm",
				"bg-[color:var(--background,white)]/80 hover:bg-[color:var(--background,white)]/95",
				"border-[color:var(--border,rgba(0,0,0,0.1))]",
				className,
			)}
			onclick={handleClick}
			icon
			type="button"
			variant="outline"
			aria-label="Scroll to latest"
			{...rest}
		>
			<ArrowDown class="size-4" />
		</Button>
	</div>
{/if}
