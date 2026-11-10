<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import { focusAfterRender } from "#src/lib/focus.js";

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

	let root: HTMLDivElement | undefined = $state();
	// The key of the row that last held focus, and the keys in the order they were drawn.
	let focusedKey: string | null = null;
	let drawn: string[] = [];

	function onfocusin(event: FocusEvent) {
		const rows = root?.querySelector("[data-triage-rows]")?.children;
		const at = rows ? [...rows].findIndex((r) => r.contains(event.target as Node)) : -1;
		focusedKey = drawn[at] ?? null;
	}

	function onfocusout(event: FocusEvent) {
		const next = event.relatedTarget;
		if (next instanceof Node && !root?.contains(next)) focusedKey = null;
	}

	// A row that leaves takes focus with it, so focus goes to the row now in its place, or the empty state.
	$effect(() => {
		const keys = items.map(key);
		const held = focusedKey;
		const at = held !== null && !keys.includes(held) ? drawn.indexOf(held) : -1;
		drawn = keys;
		if (at === -1) return;
		focusedKey = null;
		const active = document.activeElement;
		if (active && active !== document.body) return;
		const next = Math.min(at, keys.length - 1) + 1;
		void focusAfterRender(root, `[data-triage-rows] > :nth-child(${next})`, "[data-triage-empty]");
	});
</script>

<div bind:this={root} class="contents" {onfocusin} {onfocusout}>
	{#if items.length === 0}
		<div
			tabindex="-1"
			data-triage-empty
			class={cn(
				"border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center outline-none focus-visible:shadow-(--ring-focus)",
				className,
			)}
		>
			<span class="text-muted-foreground" aria-hidden="true">{@render icon?.()}</span>
			<p class="text-muted-foreground text-sm">{empty}</p>
		</div>
	{:else if kind === "plans"}
		<div data-triage-rows class={cn("space-y-4", className)}>
			{#each items as item (key(item))}
				{@render row(item)}
			{/each}
		</div>
	{:else}
		<ul
			data-triage-rows
			class={cn("bg-card border-border divide-border divide-y rounded-xl border", className)}
		>
			{#each items as item (key(item))}
				{@render row(item)}
			{/each}
		</ul>
	{/if}
</div>
