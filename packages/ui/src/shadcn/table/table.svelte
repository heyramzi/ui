<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div data-slot="table-container" class="relative w-full overflow-x-auto overscroll-x-contain">
	<!-- WHY: on a phone a four-column table squeezes every cell to ~90px and the content becomes unreadable rather than merely tight. The floor makes the -->
	<!-- container scroll sideways instead, which keeps each column legible. Unprefixed on purpose: a caller passing its own min-w (tasks-list needs 640px -->
	<!-- for seven columns) replaces this one through tailwind-merge, where a max-sm: default would instead win over it and shrink the table. A genuinely narrow table opts out with min-w-0. -->
	<table
		bind:this={ref}
		data-slot="table"
		class={cn("w-full min-w-[34rem] caption-bottom text-sm", className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
