<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import { Check, Minus } from "phosphor-svelte";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex size-4 items-center justify-center rounded-sm border shadow-btn transition-[background-color,border-color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] group-has-disabled/field:opacity-50 focus-visible:ring-3 aria-invalid:ring-3 peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 any-pointer-coarse:after:-inset-[15px] disabled:cursor-not-allowed disabled:opacity-50",
		className,
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="[&>svg]:size-3.5 grid place-content-center text-current"
		>
			{#if checked}
				<Check size={14} />
			{:else if indeterminate}
				<Minus size={14} />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
