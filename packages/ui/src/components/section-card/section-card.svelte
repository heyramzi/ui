<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import * as Card from "#src/shadcn/card/index.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		title: string;
		/** Controls at the far end of the header. */
		actions?: Snippet;
		/** No padding in the body, so a table runs edge to edge under the header. */
		flush?: boolean;
		class?: string;
		children: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let { title, actions, flush = false, class: className, children }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- WHY a fixed header height: a card with an action in its header and one
     without sat 12px apart on the same page. -->
<!-- =========================== -->
<Card.Root class={cn("gap-0 py-0", className)}>
	<header class="flex min-h-14 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
		<Card.Title as="h3" class="text-base font-medium">{title}</Card.Title>
		{#if actions}
			<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
		{/if}
	</header>
	<div class={flush ? "" : "p-4 sm:p-6"}>
		{@render children()}
	</div>
</Card.Root>
