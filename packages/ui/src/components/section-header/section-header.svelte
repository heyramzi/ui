<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import SectionLabel from "#src/components/section-header/section-label.svelte";
	import CountChip from "#src/components/chip/count-chip.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		title: string;
		/** How many things the section holds. Drawn as a chip next to the title. */
		count?: number;
		/** What the count counts, for a screen reader: "lines". */
		countLabel?: string;
		/** One line under the title. */
		description?: string;
		/** A control at the far end of the row. */
		actions?: Snippet;
		/** The heading level. Sections under a page title are 2. */
		level?: 2 | 3;
	}

	// =========================
	// PROPS
	// =========================
	let { title, count, countLabel = "items", description, actions, level = 2 }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<header class="flex items-end justify-between gap-3">
	<div class="min-w-0 space-y-1">
		<svelte:element this={`h${level}`} class="flex items-center gap-2">
			<SectionLabel class="min-w-0 [overflow-wrap:anywhere]">{title}</SectionLabel>
			{#if count !== undefined}
				<CountChip {count} size="sm" aria-label={`${count.toLocaleString()} ${countLabel}`} />
			{/if}
		</svelte:element>
		{#if description}
			<p class="text-sm text-pretty text-muted-foreground [overflow-wrap:anywhere]">
				{description}
			</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</header>
