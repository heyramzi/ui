<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} data-slot="input-otp-separator" role="separator" {...restProps}>
	{#if children}
		{@render children?.()}
	{:else}
		<!-- no-inline-svg-ignore -->
		<svg
			class="size-5 text-muted-foreground"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"><line x1="5" y1="12" x2="19" y2="12" /></svg
		>
	{/if}
</div>
