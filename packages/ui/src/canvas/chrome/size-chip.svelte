<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { onMount } from "svelte";

	// =========================
	// STATE
	// =========================
	let chip = $state<HTMLElement>();
	let width = $state(0);
	let height = $state(0);

	// =========================
	// LIFECYCLE
	// =========================
	// Layout size, which a zoom transform doesn't change. Observing the card's own box keeps the figure live through a resize drag.
	onMount(() => {
		const card = chip?.parentElement;
		if (!card) return;
		const read = () => {
			width = Math.round(card.offsetWidth);
			height = Math.round(card.offsetHeight);
		};
		read();
		const observer = new ResizeObserver(read);
		observer.observe(card);
		return () => observer.disconnect();
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span class="cv-size-chip" bind:this={chip} aria-hidden="true">{width} x {height}</span>

<!-- =========================== -->
<!-- STYLES -->
<!-- =========================== -->
<style>
	/* A table draws its add-row strip from 12 to 32 card pixels under it. The chip hangs under that, 10 screen pixels clear. */
	:global(.svelte-flow__node-table .cv-size-chip) {
		top: calc(100% + 32px + 10px * var(--canvas-unzoom, 1));
	}
</style>
