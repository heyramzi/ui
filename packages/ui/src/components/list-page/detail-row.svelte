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
	// A hairline band inside `DetailHeader` or `DetailPanel` for the record's
	// own facts, so the page never nests cards inside cards.
	muted?: boolean;
	children: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let { muted = false, children, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class={cn(
		"border-t border-border px-4 py-3 text-sm leading-relaxed",
		muted && "text-xs text-muted-foreground",
		className,
	)}
>
	{@render children()}
</div>
