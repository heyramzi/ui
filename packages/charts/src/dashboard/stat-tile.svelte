<script lang="ts" module>
/**
 * Which way a metric has to move to be good news. `neutral` fits a figure like
 * spend, which isn't a win or a loss until the return sits beside it.
 */
export type StatDirection = "up-good" | "down-good" | "neutral";
</script>

<script lang="ts">
// =========================
// IMPORTS
// =========================
import NumberChart from "../number-chart.svelte";
import Sparkline from "../sparkline.svelte";
import type { Snippet } from "svelte";
import { cn } from "@heyramzi/utils";
import { Icon } from "@heyramzi/ui/components/icon";
import type { PhosphorIcon } from "@heyramzi/ui/lib/icon-types.js";

// =========================
// TYPES
// =========================
interface Props {
	label: string;
	/** Already formatted. The tile never guesses a currency or a locale. */
	value: string;
	/**
	 * Percent change against the previous period. `null` means nothing to
	 * compare yet and draws a dash. Omit it when the figure has no period at all.
	 */
	deltaPct?: number | null;
	direction?: StatDirection;
	/** The one figure the screen was opened to read. Set it on exactly one tile. */
	lead?: boolean;
	/** A quiet line under the value: what it was measured over, or why it is a dash. */
	hint?: string;
	/**
	 * 0 to 1, drawn as a track under the value: share of a total or progress to
	 * a target. Omit it for a cash balance.
	 */
	share?: number;
	/** What `share` is measured against, e.g. "of revenue". Only with `share`. */
	shareLabel?: string;
	/** Track colour. The first series token unless a tile means something else. */
	color?: string;
	/**
	 * A shape behind the figure, oldest first, bled along the card's bottom.
	 * The treatment every tile gives a number with a history. Omit when there
	 * is none.
	 */
	series?: number[];
	/** Leading mark before the label. */
	icon?: PhosphorIcon;
	/**
	 * Makes the tile a link, like a balance that opens the bank. It lives here so
	 * a linked figure isn't drawn as a second, different card style.
	 */
	href?: string;
	/** What the link opens, shown on hover. Only with `href`. */
	hrefLabel?: string;
	/**
	 * `_blank` for a figure that leaves the app (a bank, a provider console),
	 * `_self` for one that is another page of this app. Only with `href`.
	 */
	target?: "_self" | "_blank";
	/**
	 * A chip at the end of the label row: the limit the figure is judged against,
	 * the state it is in. Wins over `hrefLabel`, which is only a hover hint.
	 */
	badge?: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let {
	label,
	value,
	deltaPct,
	direction = "neutral",
	lead = false,
	hint,
	share,
	shareLabel,
	color,
	series,
	icon,
	href,
	hrefLabel,
	target = "_blank",
	badge,
	class: className,
}: Props = $props();

// =========================
// DERIVED
// =========================
// `Sparkline` plots rows, and a card carries a bare series. Two points is a
// line, not a shape, so it is not drawn.
let points = $derived(series?.map((value, index) => ({ i: index, v: value })) ?? []);
let hasSeries = $derived(points.length > 2);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The figure is `NumberChart` from the chart library, because this tile and
     the numbers on the panels beside it are the same object and drawn twice
     they drift. -->
<svelte:element
	this={href ? "a" : "div"}
	{href}
	target={href ? target : undefined}
	rel={href && target === "_blank" ? "noopener noreferrer" : undefined}
	data-series={hasSeries ? "" : undefined}
	class={cn(
		"hr-stat-tile group/tile relative block rounded-xl",
		href && "t-press focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
		className,
	)}
>
	{#snippet tileIcon()}
		{#if icon}<Icon {icon} size={14} class="shrink-0" />{/if}
	{/snippet}

	<NumberChart
		{label}
		{value}
		delta={deltaPct}
		{direction}
		{share}
		{shareLabel}
		{color}
		icon={icon ? tileIcon : undefined}
		size={lead ? "lg" : "md"}
		caption={hint}
		class={cn(
			"h-full",
			// A label is never clipped: a chip that doesn't fit drops under it.
			"[&_.hr-number-label]:flex-wrap [&_.hr-number-label-text]:shrink-0",
			deltaPct === undefined && "[&_.hr-number-delta]:hidden!",
		)}
		trailing={badge ?? (href && hrefLabel ? linkHint : undefined)}
	/>

	<!-- The shape behind the number, bled to the card's bottom corners. The
	     scoped rule below reserves the room so it never sits on the caption. -->
	{#if hasSeries}
		<div
			class="pointer-events-none absolute inset-x-px bottom-px h-12 overflow-hidden rounded-b-[calc(var(--radius-xl)-1px)]"
			aria-hidden="true"
		>
			<Sparkline data={points} xKey="i" yKey="v" color={color ?? "var(--chart-1)"} height={48} bare />
		</div>
	{/if}
</svelte:element>

{#snippet linkHint()}
	<span class="opacity-0 transition-opacity group-hover/tile:opacity-100">{hrefLabel}</span>
{/snippet}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* WHY scoped here: `NumberChart` has no
	   series, so the sparkline's bottom room is added on the tile that draws it. */
	.hr-stat-tile[data-series] :global(.hr-number-chart) {
		padding-bottom: 4.25rem;
	}
</style>
