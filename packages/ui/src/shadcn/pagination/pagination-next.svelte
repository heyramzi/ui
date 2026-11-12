<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { CaretRight } from "phosphor-svelte";
	import { buttonVariants } from "#src/shadcn/button/index.js";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		label = "Next",
		...restProps
	}: PaginationPrimitive.NextButtonProps & {
		/** The text beside the arrow from `sm` up. Name the button with `aria-label`. */
		label?: string;
	} = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	aria-label="Go to next page"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "pr-2!", className)}
	{...restProps}
>
	<span class="hidden sm:block">{label}</span>
	<CaretRight
		aria-hidden="true"
		data-icon="inline-end"
		class="cn-rtl-flip"
	/>
</PaginationPrimitive.NextButton>
