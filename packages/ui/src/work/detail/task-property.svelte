<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import PropertyRow from "#src/components/work-parts/property-row.svelte";

	interface Props {
		label: string;
		/** A Phosphor icon before the label, shown when the rail is wide. */
		icon?: Component<{ class?: string; "aria-hidden"?: boolean | "true" | "false" }>;
		children: Snippet;
	}

	let { label, icon, children }: Props = $props();
</script>

<!-- A labelled row in the rail: icon, label, value. In the narrow chip row the label hides and
     names the group for assistive tech. -->
<PropertyRow {label} {icon} layout="responsive">{@render children()}</PropertyRow>
