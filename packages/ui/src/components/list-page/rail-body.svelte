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
	// The scroller under `RailHead`. `min-h-0` makes a flex child scroll instead
	// of growing its parent, and it's the line hand-rolled rails forgot.
	children: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let { children, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("min-h-0 flex-1 overflow-y-auto", className)}>
	{@render children()}
</div>
