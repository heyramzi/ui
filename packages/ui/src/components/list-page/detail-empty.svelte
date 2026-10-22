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
		// Shown when nothing is picked or the board is empty. Both mean "content
		// goes here", so both get a dashed `border-2` edge.
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
<div
	class={cn(
		"flex h-full items-center justify-center rounded-xl border-2 border-dashed border-border",
		className,
	)}
>
	<EmptyState {icon} {iconWeight} {title} {description} {actionLabel} {actionHref} {onAction} />
</div>
