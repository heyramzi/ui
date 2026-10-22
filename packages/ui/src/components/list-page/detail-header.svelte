<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		// Answers three questions in one order: what is this, what state is it in,
		// what can I do with it. Each queue page used to order them differently.
		title: string;
		// The state chip beside the title.
		badge?: Snippet;
		// A picture ahead of the title, like a video frame or a deck cover. Some
		// records aren't recognisable from their title alone.
		leading?: Snippet;
		// Facts about the record, rendered as one dot-separated line under the
		// title. Falsy entries drop out, so a caller can inline its conditionals.
		meta?: Array<string | null | undefined | false>;
		// A sentence under the meta line, when the record explains itself.
		note?: string | null;
		// What you can do to the record. Pinned right of the identity block, EXCEPT
		// when a picture leads: see the note in the markup.
		actions?: Snippet;
		// The top-right control, a record's way out. Pass `undefined` when empty:
		// an empty snippet is still truthy and reserves the corner.
		corner?: Snippet;
		// Hairline-separated rows below the identity block. Use `DetailRow`.
		children?: Snippet;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		title,
		badge,
		leading,
		meta,
		note,
		actions,
		corner,
		children,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let facts = $derived((meta ?? []).filter((item): item is string => Boolean(item)));
	// Actions stack under the meta when something else claims the right edge:
	// a picture, or the corner. Pinned beside a corner, they left the title
	// a third of the row.
	let stackActions = $derived(Boolean(leading || corner));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<section class={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
	<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-4">
		{#if leading}
			<div class="shrink-0">{@render leading()}</div>
		{/if}
		<div class="min-w-0 flow-root flex-1 basis-64">
			<!-- The corner floats, so only the lines beside it give way. Reserved
			     across the whole row it took ~150px off every line and wrapped a
			     normal title to three. -->
			{#if corner}
				<div class="float-end ms-3">{@render corner()}</div>
			{/if}
			<!-- The badge sits inline in the h2 so it trails the last word. As a
			     flex sibling it wrapped to its own row on every two-line title. -->
			<!-- No text-balance: it evens the lines out, so a two-line title stopped
			     short of the corner instead of running the full width. -->
			<h2 class="min-w-0 font-heading text-lg font-semibold leading-snug tracking-tight">
				{title}{#if badge}<span class="ms-2 inline-flex align-middle">{@render badge()}</span>{/if}
			</h2>
			{#if facts.length > 0}
				<!-- Each dot hangs off the fact it leads, so a wrapped line's dot stays
				     in the gutter. A standalone flex-item dot dangled on the line above. -->
				<div class="mt-1 overflow-hidden">
					<p class="-ms-3 flex flex-wrap items-center text-sm text-muted-foreground">
						{#each facts as fact, i (i)}
							<span
								class="relative ps-3 before:absolute before:start-1 before:opacity-40 before:content-['·']"
								>{fact}</span
							>
						{/each}
					</p>
				</div>
			{/if}
			{#if note}
				<p class="mt-1 text-sm text-muted-foreground">{note}</p>
			{/if}
			<!-- With a picture or a corner, actions sit in this column. Pinned right
			     they wrapped under the picture and read like its caption. -->
			{#if actions && stackActions}
				<div class="clear-both flex flex-wrap items-center gap-2 pt-3">
					{@render actions()}
				</div>
			{/if}
		</div>
		{#if actions && !stackActions}
			<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
		{/if}
	</div>
	{#if children}
		{@render children()}
	{/if}
</section>
