<script lang="ts">
	import { CANVAS, sfSymbols } from "@heyramzi/ui/icons/sf-symbols";

	let { name, class: className }: { name: keyof typeof sfSymbols; class?: string } = $props();

	let s = $derived(sfSymbols[name]);
</script>

<svg viewBox="0 0 {CANVAS} {CANVAS}" class={className} fill="currentColor" aria-hidden="true">
	<g transform="translate({(CANVAS - s.w) / 2} {(CANVAS - s.h) / 2})">
		{#each s.paths as d (d)}<path {d} />{/each}
	</g>
</svg>
