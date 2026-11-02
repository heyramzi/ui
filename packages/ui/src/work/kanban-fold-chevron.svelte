<script lang="ts">
	import { CaretDown } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";

	interface Props {
		/** Flips the caret to point up. */
		open: boolean;
		class?: string;
	}

	let { open, class: className }: Props = $props();
</script>

<span
	class={cn("kanban-fold-chevron [&>svg]:size-full", open && "kanban-fold-chevron-open", className)}
	aria-hidden="true"><CaretDown weight="bold" /></span
>

<style>
	.kanban-fold-chevron {
		display: inline-flex;
		transition: transform var(--duration-fast) var(--ease-smooth-out);
	}

	.kanban-fold-chevron-open {
		transform: scaleY(-1);
	}

	@media (prefers-reduced-motion: reduce) {
		.kanban-fold-chevron {
			transition: none;
		}
	}
</style>
