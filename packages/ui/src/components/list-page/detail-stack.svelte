<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { cn } from "@heyramzi/utils";

// =========================
// TYPES
// =========================
interface Props {
	// A flat stack of panels at one gap. `xl:pr-1` keeps the top panel's
	// corner clear of the shell's scrollbar.

	// `fill` makes the stack at least as tall as its scroller, so a `grow`
	// panel (like a writing box) takes the empty bottom third back.
	fill?: boolean;
	children: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let { fill = false, children, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("flex flex-col gap-4 xl:pr-1", fill && "min-h-full", className)}>
	{@render children()}
</div>
