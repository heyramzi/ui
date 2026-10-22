<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { setContext } from "svelte";
	import { CaretLeft } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import {
		MASTER_DETAIL_PANE,
		type MasterDetailPane,
	} from "#src/components/list-page/queue-rail.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		// The list rail (an <aside>) and the content pane. Pages style both; this
		// shell owns the two columns and the min-h-0/min-w-0 scroll containment.
		rail: Snippet;
		detail: Snippet;
		// A full-width strip above both columns for facts to read before acting,
		// like a posting cap. Pages wrapping the shell to add one broke the padding.
		banner?: Snippet;
		// WHY: a CSS grid track for the rail column ("16rem", "minmax(280px, 340px)").
		// Queue pages pass `queueRailWidth` rather than a literal.
		railWidth?: string;
		// Stack to one column below this. "lg" because rail and detail can't both be
		// read under 1024px. null only for a rail narrow enough for a phone.
		stackBelow?: "lg" | "xl" | null;
		// WHY: the phone back button says where it goes back to. "Back" alone is the
		// browser's word and the reader has to remember what they left.
		backLabel?: string;
		// Bindable so a url naming a record opens on it after a refresh or a pasted
		// link. The page sets it. Ignored above the stack breakpoint.
		pane?: "rail" | "detail";
		gap?: boolean;
		pad?: boolean;
		railClass?: string;
		detailClass?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		rail,
		detail,
		banner,
		railWidth = "minmax(260px, 320px)",
		stackBelow = "lg",
		backLabel = "Back to the list",
		// The rail wins by default: an unpicked detail is an empty state or a
		// guessed row, both worse than the list.
		pane = $bindable("rail"),
		gap = true,
		pad = true,
		railClass,
		detailClass,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	// One pane at a time when stacked. Two rows put a 34svh list scroller on top of
	// a record scroller, and neither was readable.
	let gridClass = $derived(
		stackBelow === "xl"
			? "grid-cols-1 grid-rows-[minmax(0,1fr)] xl:grid-rows-1 xl:[grid-template-columns:var(--md-cols)]"
			: stackBelow === "lg"
				? "grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-rows-1 lg:[grid-template-columns:var(--md-cols)]"
				: "[grid-template-columns:var(--md-cols)]",
	);
	// Hidden while stacked; back to normal above the breakpoint, where both panes show.
	let hideWhileStacked = $derived(stackBelow === "xl" ? "max-xl:hidden" : "max-lg:hidden");
	// Drawn only while stacked. The back bar has no job beside a visible rail.
	let stackedOnly = $derived(stackBelow === "xl" ? "xl:hidden" : "lg:hidden");

	// =========================
	// FUNCTIONS
	// =========================
	// `RailRow` calls this when a record is picked. Above the breakpoint the classes
	// that read `pane` are all prefixed away, so the flag changes nothing there.
	setContext<MasterDetailPane>(MASTER_DETAIL_PANE, {
		open: () => {
			if (stackBelow) pane = "detail";
		},
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet columns(inBanner: boolean)}
	<div
		class={cn(
			"md-cols grid min-h-0",
			inBanner ? "flex-1" : "h-full",
			gap && "gap-4",
			pad && !inBanner && "p-4",
			gridClass,
			className,
		)}
		style="--md-cols: {railWidth} minmax(0, 1fr)"
		data-pane={stackBelow ? pane : undefined}
		data-stack={stackBelow ?? undefined}
	>
		<aside
			class={cn("md-rail min-h-0", railClass, stackBelow && pane === "detail" && hideWhileStacked)}
		>
			{@render rail()}
		</aside>
		<div
			class={cn(
				"md-detail flex min-h-0 min-w-0 flex-col",
				stackBelow && pane === "rail" && hideWhileStacked,
			)}
		>
			{#if stackBelow}
				<!-- WHY a button and not a link: nothing navigated, so there is no url to
				     go back to and the browser's own back would leave the page. -->
				<Button
					variant="ghost"
					size="sm"
					class={cn("-mx-1 mb-2 self-start px-1 text-muted-foreground", stackedOnly)}
					onclick={() => (pane = "rail")}
				>
					<CaretLeft size={16} weight="bold" />
					{backLabel}
				</Button>
			{/if}
			<div class={cn("min-h-0 min-w-0 flex-1", detailClass)}>
				{@render detail()}
			</div>
		</div>
	</div>
{/snippet}

{#if banner}
	<div class={cn("flex h-full min-h-0 flex-col", gap && "gap-4", pad && "p-4")}>
		{@render banner()}
		{@render columns(true)}
	</div>
{:else}
	{@render columns(false)}
{/if}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* The stacked list-to-record swap. The incoming pane moves: forward from the
	   right, back from the left. It runs when `data-pane` flips. */
	@media (max-width: 1023px) {
		.md-cols[data-stack="lg"][data-pane="detail"] > .md-detail {
			animation: md-in-forward var(--duration-fast) var(--ease-smooth-out) both;
		}

		.md-cols[data-stack="lg"][data-pane="rail"] > .md-rail {
			animation: md-in-back var(--duration-fast) var(--ease-smooth-out) both;
		}
	}

	@media (max-width: 1279px) {
		.md-cols[data-stack="xl"][data-pane="detail"] > .md-detail {
			animation: md-in-forward var(--duration-fast) var(--ease-smooth-out) both;
		}

		.md-cols[data-stack="xl"][data-pane="rail"] > .md-rail {
			animation: md-in-back var(--duration-fast) var(--ease-smooth-out) both;
		}
	}

	@keyframes md-in-forward {
		from {
			opacity: 0;
			transform: translateX(var(--distance-large));
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes md-in-back {
		from {
			opacity: 0;
			transform: translateX(calc(var(--distance-large) * -1));
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.md-cols > .md-rail,
		.md-cols > .md-detail {
			animation-duration: 1ms;
		}
	}
</style>
