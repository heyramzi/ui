<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface ConfirmationRequestProps {
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { getConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let { children }: ConfirmationRequestProps = $props();

	const ctx = getConfirmationContext();
</script>

{#if ctx.kind === "requested"}
	<!-- WHY: the wrapper mirrors the parent section's stack so the state swap can
       animate as one block without changing the children's layout. -->
	<div
		class="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none"
	>
		{@render children?.()}
	</div>
{/if}
