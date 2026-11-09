<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import EmptyState from "#src/components/list-page/empty-state.svelte";
	import { cn } from "#src/lib/utils.js";
	import type { PhosphorIcon, IconWeight } from "#src/lib/icon-types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		// Says a filter came back empty, in one sentence that fits a 280px rail.
		icon?: PhosphorIcon;
		iconWeight?: IconWeight;
		iconClass?: string;
		title: string;
		hint?: string;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let { icon, iconWeight, iconClass, title, hint, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<EmptyState
	size="sm"
	class={cn("h-full", className)}
	{icon}
	{iconWeight}
	{iconClass}
	{title}
	description={hint}
/>
