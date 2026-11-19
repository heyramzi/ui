<script lang="ts">
	/*
	 * A titled settings or content block. It is `Panel` underneath (TSK-2309):
	 * the same hairline box and 44px header as every dashboard and detail panel,
	 * with the title kept as an h3 so the page outline doesn't change.
	 */

	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import Panel from "#src/lib/panel.svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		title: string;
		/** Controls at the far end of the header. */
		actions?: Snippet;
		/** No padding in the body, so a table runs edge to edge under the header. */
		flush?: boolean;
		class?: string;
		children: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let { title, actions, flush = false, class: className, children }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Panel label={title} heading={3} {actions} pad={!flush} class={className}>
	{@render children()}
</Panel>
