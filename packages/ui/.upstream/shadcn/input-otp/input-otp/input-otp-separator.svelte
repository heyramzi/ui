<script lang="ts">
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import type { WithElementRef } from "$UTILS$.js";
	import { cn } from "$UTILS$.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="input-otp-separator"
	role="separator"
	class={cn("[&_svg:not([class*='size-'])]:size-4 flex items-center", className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<IconPlaceholder
			lucide="MinusIcon"
			tabler="IconMinus"
			hugeicons="MinusSignIcon"
			phosphor="MinusIcon"
			remixicon="RiSubtractLine"
		/>
	{/if}
</div>
