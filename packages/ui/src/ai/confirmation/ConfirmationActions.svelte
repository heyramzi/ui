<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface ConfirmationActionsProps extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { getConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let { class: className, children, ...rest }: ConfirmationActionsProps = $props();

	const ctx = getConfirmationContext();
</script>

{#if ctx.kind === "requested"}
	<div class={cn("mt-1 flex items-center gap-2", className)} {...rest}>
		{@render children?.()}
	</div>
{/if}
