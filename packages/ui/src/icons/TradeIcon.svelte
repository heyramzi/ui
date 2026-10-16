<script lang="ts">
	import { tradeIconMap, type TradeSlug } from "#src/icons/trades.js";

	let {
		trade,
		size = 14,
		stroke = 2,
		class: className = "",
	}: { trade: TradeSlug; size?: number; stroke?: number; class?: string } = $props();

	let Icon = $derived(tradeIconMap[trade]);
</script>

{#if Icon}
	<Icon {size} {stroke} class={className} aria-hidden="true" focusable="false" />
{/if}
