<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		band = false,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * A hairline on top and a quiet surface edge to edge, following the sheet's bottom
		 * corners when it floats. A bare `data-band` attribute does the same.
		 */
		band?: boolean;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="sheet-footer"
	data-band={band || undefined}
	class={cn(
		"mt-auto flex flex-col gap-2 p-4",
		"data-band:border-border data-band:bg-muted/50 data-band:border-t data-band:rounded-b-[inherit] data-band:flex-col-reverse data-band:sm:flex-row data-band:sm:justify-end",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
