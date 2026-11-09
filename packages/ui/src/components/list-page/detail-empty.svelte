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
		// Shown when nothing is picked or the board is empty. It sits on the white
		// panel with no frame of its own: a dashed edge drew a box round nothing.
		icon?: PhosphorIcon;
		iconWeight?: IconWeight;
		title: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		icon,
		iconWeight,
		title,
		description,
		actionLabel,
		actionHref,
		onAction,
		class: className,
	}: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<EmptyState
	surface="card"
	class={cn("h-full", className)}
	{icon}
	{iconWeight}
	{title}
	{description}
	{actionLabel}
	{actionHref}
	{onAction}
/>
