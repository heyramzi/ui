<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import { cn } from "#src/lib/utils.js";

	interface Props {
		label: string;
		/** A Phosphor icon before the label. */
		icon?: Component<{ class?: string; "aria-hidden"?: boolean | "true" | "false" }>;
		/**
		 * `responsive`: the label hides in a narrow container (a chip row) and shows as a column
		 * from `@3xl` up. `row`: always icon, label, value.
		 */
		layout?: "row" | "responsive";
		children: Snippet;
		class?: string;
	}

	let { label, icon: Icon, layout = "row", children, class: className }: Props = $props();
</script>

<!-- One property: icon and label on the left in muted text, the value on the right. -->
<div
	role="group"
	aria-label={label}
	class={cn(
		"min-h-8 items-center gap-2",
		layout === "row"
			? "grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)]"
			: "flex @3xl:grid @3xl:grid-cols-[7rem_minmax(0,1fr)]",
		className,
	)}
>
	<span
		class={cn(
			"min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground",
			layout === "row" ? "flex" : "hidden @3xl:flex",
		)}
		aria-hidden="true"
	>
		{#if Icon}<Icon class="size-4 shrink-0" aria-hidden="true" />{/if}
		<span class="truncate">{label}</span>
	</span>
	<div class="flex min-w-0 items-center">{@render children()}</div>
</div>
