<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { cn } from "@heyramzi/utils";
import type { PhosphorIcon } from "#src/lib/icon-types.js";

// =========================
// TYPES
// =========================
type Props = {
	// The one label style for panel, rail group and sub-section headers. Retyped
	// copies drifted to a different tracking value.
	icon?: PhosphorIcon;
	children: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let { icon: Icon, children, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span
	class={cn(
		"flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
		className,
	)}
>
	{#if Icon}
		<Icon class="size-4 text-brand-indigo" aria-hidden="true" />
	{/if}
	{@render children()}
</span>
