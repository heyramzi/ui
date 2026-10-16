<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { cn } from "@heyramzi/utils";

// =========================
// TYPES
// =========================
type Props = {
	/** `<StatTile>` children. Four to a row on a desk, two on a phone. */
	children: Snippet;
	/**
	 * Cards per row at the widest breakpoint, four unless the set is smaller.
	 * Five and six are only for a fixed scorecard. The headline stays one row.
	 */
	columns?: 2 | 3 | 4 | 5 | 6;
	class?: string;
};

// =========================
// PROPS
// =========================
let { children, columns = 4, class: className }: Props = $props();

// =========================
// DERIVED
// =========================
const COLUMNS: Record<2 | 3 | 4 | 5 | 6, string> = {
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-2 lg:grid-cols-3",
	4: "sm:grid-cols-2 lg:grid-cols-4",
	5: "sm:grid-cols-3 lg:grid-cols-5",
	6: "sm:grid-cols-3 xl:grid-cols-6",
};
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- Numbers get number cards. One panel with hairlines made four figures float
     in one box on a dark theme, where hairlines vanish. -->
<!-- No border on the band itself: the cards carry it, or it's a box of boxes. -->
<div class={cn("grid grid-cols-2 gap-4", COLUMNS[columns], className)}>
	{@render children()}
</div>
