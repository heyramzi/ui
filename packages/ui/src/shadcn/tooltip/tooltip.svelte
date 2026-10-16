<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import TooltipProvider from "#src/shadcn/tooltip/tooltip-provider.svelte";
	import { hasTooltipProvider } from "#src/shadcn/tooltip/context.js";

	let { open = $bindable(false), ...restProps }: TooltipPrimitive.RootProps = $props();

	// Mount a provider only when nothing above has. A nested one shadows the outer
	// scope, which is how a group of tooltips loses its shared skip window.
	const standalone = !hasTooltipProvider();
</script>

{#if standalone}
	<TooltipProvider>
		<TooltipPrimitive.Root bind:open {...restProps} />
	</TooltipProvider>
{:else}
	<TooltipPrimitive.Root bind:open {...restProps} />
{/if}
