<script lang="ts">
	/*
	 * The one titled panel, exported as `DataPanel` from the dashboard and `DetailPanel`
	 * from list-page. Both drew the same box from `panel.ts` with different props.
	 */

	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import SectionLabel from "#src/components/section-header/section-label.svelte";
	import { cn } from "#src/lib/utils.js";
	import { panelHeaderClass, panelShellClass } from "#src/lib/panel.js";
	import type { PhosphorIcon } from "#src/lib/icon-types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** What this panel is, drawn as the app's one panel label. No label, no actions: no header. */
		label?: string;
		labelIcon?: PhosphorIcon;
		/** A mark the icon set lacks (a platform logo), drawn ahead of the label at the same size. */
		labelLead?: Snippet;
		/** A line under the label, for the scope a number was measured over. */
		sublabel?: string;
		/**
		 * A row count, total or freshness stamp. A prop, not an action, because
		 * hand-placed hints ended up at three type sizes on one screen.
		 */
		hint?: string;
		/** Controls that act on this panel. Pinned right, after the hint. */
		actions?: Snippet;
		/** Off for a body that supplies its own padding: a table, a media grid, a full-bleed list. */
		pad?: boolean;
		/** The body scrolls sideways rather than squeezing, for a table wider than the window. */
		scroll?: boolean;
		/** Takes the height the panels above it left, inside a `fill` stack. One per stack. */
		grow?: boolean;
		children: Snippet;
		class?: string;
		bodyClass?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		label,
		labelIcon,
		labelLead,
		sublabel,
		hint,
		actions,
		pad = true,
		scroll = false,
		grow = false,
		children,
		class: className,
		bodyClass,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let titled = $derived(Boolean(label || labelLead || sublabel));
	let hasHeader = $derived(titled || Boolean(hint || actions));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<section class={cn(panelShellClass, grow && "flex min-h-0 flex-1 flex-col", className)}>
	{#if hasHeader}
		<div class={panelHeaderClass}>
			{#if titled}
				<div class="flex min-w-0 flex-col gap-0.5">
					{#if label || labelLead}
						<SectionLabel icon={labelIcon}>
							{@render labelLead?.()}
							{label}
						</SectionLabel>
					{/if}
					{#if sublabel}
						<span class="truncate text-xs text-muted-foreground">{sublabel}</span>
					{/if}
				</div>
			{:else}
				<!-- Holds the left slot so the actions stay pinned right. -->
				<span></span>
			{/if}
			{#if hint || actions}
				<div class="flex min-w-0 items-center gap-3">
					{#if hint}
						<span class="text-xs tabular-nums text-muted-foreground">{hint}</span>
					{/if}
					{#if actions}
						<div class="flex min-w-0 flex-wrap items-center justify-end gap-2">
							{@render actions()}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	<div
		class={cn(
			pad && "p-4",
			scroll && "overflow-x-auto",
			grow && "flex min-h-0 flex-1 flex-col",
			bodyClass,
		)}
	>
		{@render children()}
	</div>
</section>
