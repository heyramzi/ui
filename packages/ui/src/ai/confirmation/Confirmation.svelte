<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { ConfirmationState } from "#src/ai/confirmation/confirmation-context.svelte.js";

	export interface ConfirmationProps extends HTMLAttributes<HTMLElement> {
		kind: ConfirmationState;
		executing?: boolean;
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { setConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let {
		kind,
		executing = false,
		class: className,
		children,
		...rest
	}: ConfirmationProps = $props();

	// WHY: setContext runs once on mount but the value is referenced reactively via the proxy Svelte sets up on objects passed to setContext.

	// State changes rerun any $derived in child components.
	const ctx = $state({ kind, executing });
	$effect(() => {
		ctx.kind = kind;
		ctx.executing = executing;
	});
	setConfirmationContext(ctx);
</script>

{#if kind !== "idle"}
	{@const isResolved = kind === "accepted" || kind === "rejected" || kind === "failed"}
	<section
		class={cn(
			"flex flex-col gap-2 rounded-lg border p-3",
			"border-[color:var(--border,rgba(0,0,0,0.1))] bg-[color:var(--card,white)] shadow-sm",
			className,
		)}
		aria-label="Confirmation"
		aria-busy={executing ? "true" : undefined}
		role={isResolved ? "status" : undefined}
		aria-live={isResolved ? "polite" : undefined}
		data-state={kind}
		{...rest}
	>
		{@render children?.()}
	</section>
{/if}
