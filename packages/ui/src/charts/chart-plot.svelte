<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/charts/chart-a11y.css";
	import type { Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import { nextPoint, rowSummary, type ChartTable } from "#src/charts/chart-a11y.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The plot's accessible name and the hidden table's caption. */
		label: string;
		/** From chartTable(): the summary read after the name, and one row per point. */
		table: ChartTable;
		/** Shows point `i`'s tooltip, or clears it on `null`. */
		onStep?: (i: number | null) => void;
		/** Any CSS length. */
		height?: string | null;
		class?: string;
		children: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let { label, table, onStep, height, class: className, children }: Props = $props();

	// =========================
	// STATE
	// =========================
	const uid = $props.id();
	let at = $state(-1);

	// =========================
	// FUNCTIONS
	// =========================
	function onkeydown(e: KeyboardEvent) {
		const next = nextPoint(e.key, at, count);
		if (next === undefined) return;
		e.preventDefault();
		at = next ?? -1;
		onStep?.(next);
	}

	function onfocusout() {
		if (at < 0) return;
		at = -1;
		onStep?.(null);
	}

	// =========================
	// DERIVED
	// =========================
	const count = $derived(onStep ? table.rows.length : 0);
	const shown = $derived(table.rows.length > 0);
	const announce = $derived(at >= 0 ? rowSummary(table, at) : "");
</script>

<!-- =========================== -->
<!-- CHART PLOT -->
<!-- =========================== -->
<!-- WHY application: a screen reader in browse mode keeps the arrow keys for itself on an img. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={cn("hr-chart-plot", className)}
	style:height
	role={shown ? (count > 0 ? "application" : "img") : undefined}
	aria-roledescription={count > 0 ? "chart" : undefined}
	aria-label={shown ? label : undefined}
	aria-describedby={shown ? `${uid}-summary` : undefined}
	tabindex={count > 0 ? 0 : undefined}
	{onkeydown}
	{onfocusout}
>
	{@render children()}
</div>
{#if shown}
	<p id="{uid}-summary" class="hr-sr-only">{table.summary}</p>
	{#if count > 0}
		<p class="hr-sr-only" aria-live="polite">{announce}</p>
	{/if}
	<table class="hr-sr-only">
		<caption>{label}</caption>
		<thead>
			<tr>
				<th scope="col">{table.xLabel}</th>
				{#each table.columns as column, j (j)}
					<th scope="col">{column}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each table.rows as row, i (i)}
				<tr>
					<th scope="row">{row.x}</th>
					{#each row.cells as cell, j (j)}
						<td>{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
