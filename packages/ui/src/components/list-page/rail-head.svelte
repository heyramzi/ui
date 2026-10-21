<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import SectionLabel from "#src/components/list-page/section-label.svelte";
import { cn } from "#src/lib/utils.js";

// =========================
// TYPES
// =========================
interface Props {
	// The fixed top of a queue rail: label, filter, search. A fixed height, so
	// rows start on the same line on every queue page.
	label?: string;
	// A low-emphasis control beside the label (compose, refresh).
	action?: Snippet;
	// The filter, the search, whatever narrows the list. Optional: a rail of four
	// records has nothing to narrow, and an empty strip under the label is chrome.
	children?: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let { label, action, children, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("shrink-0 space-y-2 border-b border-border px-3 py-2.5", className)}>
	{#if label || action}
		<div class="flex min-h-7 items-center justify-between gap-2 pl-1">
			{#if label}
				<SectionLabel>{label}</SectionLabel>
			{:else}
				<span></span>
			{/if}
			{#if action}
				{@render action()}
			{/if}
		</div>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>
