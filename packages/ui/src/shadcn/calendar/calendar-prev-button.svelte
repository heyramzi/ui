<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { CaretLeft } from "phosphor-svelte";
	import { buttonVariants, type ButtonVariant } from "#src/shadcn/button/index.js";
	import { cn } from "#src/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		variant = "ghost",
		...restProps
	}: CalendarPrimitive.PrevButtonProps & {
		variant?: ButtonVariant;
	} = $props();
</script>

{#snippet Fallback()}
	<CaretLeft class="size-4" />
{/snippet}

<CalendarPrimitive.PrevButton
	bind:ref
	class={cn(
		buttonVariants({ variant }),
		"size-(--cell-size) bg-transparent p-0 select-none disabled:opacity-50 rtl:rotate-180",
		className,
	)}
	children={children || Fallback}
	{...restProps}
/>
