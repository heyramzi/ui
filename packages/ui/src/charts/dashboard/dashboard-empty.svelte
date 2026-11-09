<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import EmptyState from "#src/components/list-page/empty-state.svelte";
	import type { PhosphorIcon } from "#src/lib/icon-types.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		// The dashed edge marks truly empty, not loading.
		icon?: PhosphorIcon;
		title: string;
		description?: string;
		/** One or two buttons. Omit where there is nothing the reader can do. */
		actions?: Snippet;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let { icon, title, description, actions, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<EmptyState surface="dashed" class={className} {icon} {title} {description} {actions} />
