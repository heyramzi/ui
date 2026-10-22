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
		/** `<DataPanel>` children, or tiles standing beside one. */
		children: Snippet;
		/**
		 * Panels per row: two charts, three breakdowns, or `main`, where the first
		 * child takes two thirds and the rates beside it one third.
		 */
		columns?: 2 | 3 | "main";
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let { children, columns = 2, class: className }: Props = $props();

	// =========================
	// CONSTANTS
	// =========================
	const COLUMNS: Record<2 | 3 | "main", string> = {
		2: "lg:grid-cols-2",
		3: "lg:grid-cols-2 xl:grid-cols-3",
		main: "lg:grid-cols-3 lg:[&>*:first-child]:col-span-2",
	};
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The one row of panels side by side. -->
<div class={cn("grid gap-4", COLUMNS[columns], className)}>
	{@render children()}
</div>
