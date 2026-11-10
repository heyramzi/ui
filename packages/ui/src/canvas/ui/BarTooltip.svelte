<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { Kbd } from "#src/shadcn/kbd/index.js";
	import * as Tooltip from "#src/shadcn/tooltip/index.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Shown in the tooltip, and the button's name unless `name` is set. */
		label: string;
		/** The name a screen reader reads, when it needs more than the tooltip, like "Fill: Red". */
		name?: string;
		/** The single key that picks this tool, shown beside the label and set as aria-keyshortcuts. */
		shortcut?: string;
		side?: "top" | "right" | "bottom" | "left";
		/** The bar control. Spread `props` on it, so the tooltip opens from it and names it. */
		child: Snippet<[{ props: Record<string, unknown> }]>;
	}

	// =========================
	// PROPS
	// =========================
	// Renamed, because the trigger's own `child` snippet below would shadow it.
	let { label, name = label, shortcut, side = "top", child: control }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			{@render control({
				props: { ...props, "aria-label": name, "aria-keyshortcuts": shortcut || undefined },
			})}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Content {side} sideOffset={10} class="flex items-center gap-2">
		{label}
		{#if shortcut}<Kbd>{shortcut}</Kbd>{/if}
	</Tooltip.Content>
</Tooltip.Root>
