<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface ConfirmationRejectedProps {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { getConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let { children }: ConfirmationRejectedProps = $props();

	const ctx = getConfirmationContext();
</script>

{#if ctx.kind === "rejected"}
	<div
		class="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none"
	>
		{@render children?.()}
	</div>
{/if}
