<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { ConfirmationState } from "#src/ai/confirmation/confirmation-context.svelte.js";

	export interface ConfirmationStateProps {
		/** The state whose content this shows. */
		when: Exclude<ConfirmationState, "idle">;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { getConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let { when, children }: ConfirmationStateProps = $props();

	const ctx = getConfirmationContext();
</script>

{#if ctx.kind === when}
	<!-- WHY: the wrapper mirrors the parent section's stack so the state swap can
       animate as one block without changing the children's layout. -->
	<div
		class="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none"
	>
		{@render children?.()}
	</div>
{/if}
