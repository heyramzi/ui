<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { CaretRight } from "phosphor-svelte";
	import { buttonVariants, type ButtonVariant } from "#src/shadcn/button/index.js";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		children,
		variant = "ghost",
		...restProps
	}: CalendarPrimitive.NextButtonProps & {
		variant?: ButtonVariant;
	} = $props();
</script>

{#snippet Fallback()}
	<CaretRight class="size-4" />
{/snippet}

<CalendarPrimitive.NextButton
	bind:ref
	class={cn(
		buttonVariants({ variant }),
		"size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180",
		className,
	)}
	children={children || Fallback}
	{...restProps}
/>
