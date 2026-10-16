<script lang="ts">
	import { cn, type WithElementRef } from "@heyramzi/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		"data-[state=selected]:bg-muted transition-[background-color,transform,box-shadow] duration-[var(--duration-quick)] ease-out hover:bg-muted/20 hover:-translate-y-px hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
