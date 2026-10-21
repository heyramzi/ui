<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import SectionLabel from "#src/components/list-page/section-label.svelte";

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
			<SectionLabel>{title}</SectionLabel>
			{#if count !== undefined}
				<span
					class="rounded-md bg-muted px-1.5 py-0.5 text-xs leading-none font-medium tabular-nums text-muted-foreground"
					aria-label={`${count} ${countLabel}`}
				>
					{count}
				</span>
			{/if}
		</svelte:element>
		{#if description}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</header>
