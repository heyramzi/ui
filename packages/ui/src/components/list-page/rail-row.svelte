<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { getContext } from "svelte";
import { cn } from "#src/lib/utils.js";
import { MASTER_DETAIL_PANE, type MasterDetailPane } from "#src/components/list-page/queue-rail.js";

// =========================
// TYPES
// =========================
interface Props {
	// One row shape for every queue rail, in a fixed order: identity, preview,
	// facts. Three pages used to draw three different rows.
	title: string;
	selected?: boolean;
	onclick: () => void;
	// A thumbnail or avatar ahead of the title.
	leading?: Snippet;
	// The record's state, at the end of the preview line. Never beside the title,
	// where it competes with the name.
	trailing?: Snippet;
	// One line of the record's own words, under the title.
	preview?: string | null;
	// Dot-separated facts under the preview. Falsy entries drop out.
	meta?: Array<string | null | undefined | false>;
	// Which fact gives up its width first. The others hold their full text, so
	// a date or a count never truncates to nonsense.
	metaTruncate?: "first" | "last";
	// Icons that qualify the facts (a waiting reply, a removed comment).
	metaTrail?: Snippet;
	// Controls that appear on hover, over the row's top-right corner.
	actions?: Snippet;
	// Long records (thread titles) need two lines to be recognisable.
	titleLines?: 1 | 2;
	class?: string;
};

// =========================
// PROPS
// =========================
let {
	title,
	selected = false,
	onclick,
	leading,
	trailing,
	preview,
	meta,
	metaTruncate = "first",
	metaTrail,
	actions,
	titleLines = 1,
	class: className,
}: Props = $props();

// =========================
// DERIVED
// =========================
let facts = $derived((meta ?? []).filter((item): item is string => Boolean(item)));

// =========================
// FUNCTIONS
// =========================
// Picking a row moves a phone from list to record. `undefined` outside a
// `MasterDetail`, where a rail is just a list.
let row = $state<HTMLDivElement>();

// A row picked from a link, a shortcut or the next arrow can sit below the fold.
$effect(() => {
	if (selected) row?.scrollIntoView({ block: "nearest" });
});

let pane = getContext<MasterDetailPane | undefined>(MASTER_DETAIL_PANE);

function select() {
	onclick();
	pane?.open();
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The hairline belongs to the row, so grouped and flat rails draw it the same.
     `first:border-t-0` keeps each group's top row clean under its header. -->
<div
	bind:this={row}
	class={cn(
		// `group/row` too: `CopyHandoff` waits for `group-hover/row`, and a bare
		// `group` left it invisible on every rail.
		"group group/row relative border-t border-border first:border-t-0",
		selected ? "bg-accent" : "hover:bg-muted/50",
		className,
	)}
>
	<button
		type="button"
		class={cn(
			"t-press flex w-full items-start gap-3 px-4 py-3 text-left any-pointer-coarse:py-3.5",
			"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
			// WHY: the hover actions sit over this corner, so the text stops short
			// of them rather than sliding underneath when a title is long.
			actions && "pr-24",
		)}
		onclick={select}
		aria-current={selected ? "page" : undefined}
	>
		{#if leading}
			<span class="shrink-0">{@render leading()}</span>
		{/if}
		<!-- The title owns its column. A chip beside it took a third of the width
		     and clamped two-line titles. -->
		<span class="flex min-w-0 flex-1 flex-col gap-1">
			<span
				class={cn(
					"text-sm font-medium leading-snug",
					titleLines === 2 ? "line-clamp-2" : "truncate",
					selected && "text-accent-foreground",
				)}
			>
				{title}
			</span>
			<!-- The state rides the preview, not the facts. Facts are `shrink-0`, so
			     at 280px the chip got pushed off the row. Prose can give up width. -->
			{#if preview || trailing}
				<span class="flex min-w-0 items-center text-xs text-muted-foreground">
					{#if preview}
						<span class="truncate">{preview}</span>
					{/if}
					{#if trailing}
						<span class="ml-auto flex shrink-0 items-center gap-1.5 pl-2">{@render trailing()}</span>
					{/if}
				</span>
			{/if}
			{#if facts.length > 0 || metaTrail}
				<span class="flex min-w-0 items-center text-xs text-muted-foreground">
					{#each facts as fact, i (i)}
						{#if i > 0}
							<span aria-hidden="true" class="mx-1.5 shrink-0 opacity-40">&middot;</span>
						{/if}
						{@const flexible =
							facts.length > 1 && i === (metaTruncate === "last" ? facts.length - 1 : 0)}
						<span class={flexible ? "truncate" : "shrink-0"}>{fact}</span>
					{/each}
					{#if metaTrail}
						<span class="ml-1.5 flex shrink-0 items-center gap-1">{@render metaTrail()}</span>
					{/if}
				</span>
			{/if}
		</span>
	</button>
	{#if actions}
		<!-- WHY visible on a coarse pointer: there is no hover on a touchscreen, so
		     the row's actions would be unreachable there. -->
		<div
			class="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex group-focus-within:flex any-pointer-coarse:flex"
		>
			{@render actions()}
		</div>
	{/if}
</div>
