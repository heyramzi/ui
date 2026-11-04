<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!-- The scrolling middle of a sheet, padded like the header and footer so the three
     share one left edge. It takes the height the header and footer leave. -->
<div
	bind:this={ref}
	data-slot="sheet-body"
	class={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
