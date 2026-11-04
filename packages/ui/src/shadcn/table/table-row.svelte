<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
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
		"data-[state=selected]:bg-muted transition-[background-color] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] hover:bg-muted/20",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
