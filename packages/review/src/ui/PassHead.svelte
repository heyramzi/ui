<script lang="ts">
	import type { Pass } from "#src/core/types.js";
	import type { Snippet } from "svelte";

	let { pass, children }: { pass: Pass; children?: Snippet } = $props();
</script>

<header class="head">
	<!-- The sidebar already names the pass; the heading stays for screen readers only. -->
	<h1 class="sr-only">{pass.label}</h1>
	{#if children}<div class="line">{@render children()}</div>{/if}
</header>

<style>
	.head {
		display: grid;
		justify-items: start;
		gap: 4px;
		margin-bottom: 14px;
	}
	.line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		width: 100%;
	}
</style>
