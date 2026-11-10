<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { CaretRight } from "phosphor-svelte";
	import { buttonVariants } from "#src/shadcn/button/index.js";
	import { cn } from "#src/lib/utils.js";

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
	<CaretRight
		aria-hidden="true"
		data-icon="inline-end"
		class="cn-rtl-flip"
	/>
</PaginationPrimitive.NextButton>
