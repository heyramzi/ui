<script lang="ts">
// =========================
// IMPORTS
// =========================
import { Input } from "#src/shadcn/input/index.js";
import { MagnifyingGlass } from "phosphor-svelte";
import { cn } from "@heyramzi/utils";

// =========================
// TYPES
// =========================
type Props = {
	value: string;
	placeholder?: string;
	size?: "sm" | "default";
	class?: string;
};

// =========================
// PROPS
// =========================
let {
	value = $bindable(""),
	placeholder = "Search...",
	size = "default",
	class: extraClass,
}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- WHY: leading magnifying glass + a fixed height so every list page's toolbar
     keeps the same rhythm; size="sm" matches the compact filter chips and
     tabs used on dense list pages. -->
<!-- Drops the caller's desk width once the toolbar row breaks, read from the
     shell's container. Outside the shell the caller's width stands. -->
<div
	class={cn(
		"relative",
		extraClass,
		"@max-3xl/toolbar:w-auto @max-3xl/toolbar:min-w-0 @max-3xl/toolbar:flex-1"
	)}
>
	<MagnifyingGlass
		class={cn(
			"pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
			size === "sm" ? "left-2 size-3" : "left-2 size-3",
		)}
		aria-hidden="true"
	/>
	<!-- Keyed to the pointer, not the viewport. On an iPad, 12px text makes
	     Safari zoom on focus and never zoom back. -->
	<Input
		bind:value
		{placeholder}
		class={cn(
			"w-full",
			size === "sm" ? "h-7 pl-7 pr-2.5 text-xs" : "h-7 pl-7 pr-2.5 text-xs",
			"any-pointer-coarse:h-10 any-pointer-coarse:text-base",
		)}
	/>
</div>
