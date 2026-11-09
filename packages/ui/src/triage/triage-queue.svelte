<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";

	interface Props {
		items: readonly T[];
		/** The key a row is tracked by. */
		key: (item: T) => string;
		/**
		 * `plans` stacks cards that need a decision. `tasks` is one divided list of what was
		 * decided.
		 */
		kind?: "plans" | "tasks";
		/** One row: a `TriagePlan` for `plans`, a `TriageTask` for `tasks`. */
		row: Snippet<[T]>;
		/** What the person reads when nothing is waiting. */
		empty: string;
		/** The glyph above the empty text. */
		icon?: Snippet;
		class?: string;
	}

	let { items, key, kind = "plans", row, empty, icon, class: className }: Props = $props();
</script>

{#if items.length === 0}
	<div
		class={cn(
			"border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center",
			className,
		)}
	>
		<span class="text-muted-foreground" aria-hidden="true">{@render icon?.()}</span>
		<p class="text-muted-foreground text-sm">{empty}</p>
	</div>
{:else if kind === "plans"}
	<div class={cn("space-y-4", className)}>
		{#each items as item (key(item))}
			{@render row(item)}
		{/each}
	</div>
{:else}
	<ul class={cn("bg-card border-border divide-border divide-y rounded-xl border", className)}>
		{#each items as item (key(item))}
			{@render row(item)}
		{/each}
	</ul>
{/if}
