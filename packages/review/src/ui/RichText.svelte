<script lang="ts">
	import { splitRefs } from "#src/core/refs.js";
	import RefChip from "#src/ui/RefChip.svelte";

	let { text }: { text: string } = $props();
	const parts = $derived(splitRefs(text));
</script>

{#each parts as part, i (i)}{#if "text" in part}{part.text}{:else}<RefChip
			shelf={part.shelf}
			id={part.id}
		/>{/if}{/each}
