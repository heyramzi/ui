<script lang="ts">
	import { DotsThree } from "phosphor-svelte";
	import { cn, type WithElementRef, type WithoutChildren } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
	bind:this={ref}
	aria-hidden="true"
	data-slot="pagination-ellipsis"
	class={cn("size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4 flex items-center justify-center", className)}
	{...restProps}
>
	<DotsThree aria-hidden="true" />
	<span class="sr-only">More pages</span>
</span>
