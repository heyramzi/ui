<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { markTooltipProvider } from "#src/shadcn/tooltip/context.js";

	// The first tooltip waits, so a pointer crossing a toolbar does not trail a
	// line of them. The next one inside the skip window arrives with no wait.
	let {
		delayDuration = 400,
		skipDelayDuration = 300,
		...restProps
	}: TooltipPrimitive.ProviderProps = $props();

	markTooltipProvider();
</script>

<TooltipPrimitive.Provider {delayDuration} {skipDelayDuration} {...restProps} />
