<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import IconPlaceholder from "$lib/components/icon-placeholder/icon-placeholder.svelte";
	import { buttonVariants } from "$UI$/button/index.js";
	import { cn } from "$UTILS$.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	aria-label="Go to next page"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "pr-2!", className)}
	{...restProps}
>
	<span class="hidden sm:block">Next</span>
	<IconPlaceholder
		lucide="ChevronRightIcon"
		tabler="IconChevronRight"
		hugeicons="ArrowRight01Icon"
		phosphor="CaretRightIcon"
		remixicon="RiArrowRightSLine"
		data-icon="inline-end"
		class="cn-rtl-flip"
	/>
</PaginationPrimitive.NextButton>
