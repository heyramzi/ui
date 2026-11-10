<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { ConfirmationKind } from "#src/ai/confirmation/confirmation-context.svelte.js";

	export interface ConfirmationProps extends HTMLAttributes<HTMLElement> {
		kind: ConfirmationKind;
		executing?: boolean;
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { setConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let {
		kind,
		executing = false,
		class: className,
		children,
		...rest
	}: ConfirmationProps = $props();

	// WHY getters: setContext runs once on mount, so the parts read the props through these and rerun their $derived when a prop changes.
	setConfirmationContext({
		get kind() {
			return kind;
		},
		get executing() {
			return executing;
		},
	});

	let section = $state<HTMLElement | null>(null);
	let hadFocus = false;

	// The actions unmount once it resolves. If one held focus, the box takes it so focus doesn't drop to the page.
	$effect.pre(() => {
		void kind;
		hadFocus = !!section?.contains(document.activeElement);
	});

	$effect(() => {
		void kind;
		if (hadFocus && section && !section.contains(document.activeElement)) section.focus();
		hadFocus = false;
	});
</script>

{#if kind !== "idle"}
	<!-- Live from the moment it shows, so the change to the result is read out. -->
	<section
		bind:this={section}
		tabindex="-1"
		class={cn(
			"flex flex-col gap-2 rounded-lg border p-3 outline-none",
			"border-[color:var(--border,rgba(0,0,0,0.1))] bg-[color:var(--card,white)] shadow-sm",
			className,
		)}
		aria-label="Confirmation"
		aria-busy={executing ? "true" : undefined}
		aria-live="polite"
		data-state={kind}
		{...rest}
	>
		{@render children?.()}
	</section>
{/if}
