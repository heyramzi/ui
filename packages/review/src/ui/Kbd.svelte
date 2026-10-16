<script lang="ts">
	import { keycaps } from "#src/hooks/keys.svelte.js";

	let { combo }: { combo: string } = $props();
</script>

<span class="caps"
	>{#each keycaps(combo) as cap (cap)}<kbd>{cap}</kbd>{/each}</span
>

<style>
	.caps {
		display: inline-flex;
		gap: 3px;
	}
</style>
