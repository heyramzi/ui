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

<!-- The content pads it. With a close button the title stops 32px short of it,
     so a long title wraps instead of running under the X. -->
<div
	bind:this={ref}
	data-slot="dialog-header"
	class={cn(
		"flex flex-col gap-1.5 in-data-close:pe-8",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
