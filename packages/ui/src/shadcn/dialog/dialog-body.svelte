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

<!-- The fields between the header and the footer. No padding of its own: the content's
     `--dialog-pad` already lines it up with the title. -->
<div
	bind:this={ref}
	data-slot="dialog-body"
	class={cn("flex min-w-0 flex-col gap-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
