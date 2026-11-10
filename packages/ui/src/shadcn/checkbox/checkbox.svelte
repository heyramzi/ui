<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "#src/lib/utils.js";
	import { Check, Minus } from "phosphor-svelte";
	import { checkboxBoxClass } from "#src/shadcn/checkbox/checkbox-box.js";

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
	class={cn(checkboxBoxClass, className)}
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
				<Check aria-hidden="true" size={14} />
			{:else if indeterminate}
				<Minus aria-hidden="true" size={14} />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
