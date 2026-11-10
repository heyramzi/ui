<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLSelectAttributes } from "svelte/elements";
	import { CaretDown } from "phosphor-svelte";

	type NativeSelectProps = Omit<WithElementRef<HTMLSelectAttributes, HTMLSelectElement>, "size"> & {
		size?: "sm" | "default";
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size = "default",
		children,
		...restProps
	}: NativeSelectProps = $props();
</script>

<div
	class={cn(
		"group/native-select relative w-fit has-[select:disabled]:opacity-50",
		className,
	)}
	data-slot="native-select-wrapper"
	data-size={size}
>
	<!-- The kit's Select trigger sizes: 32px, 28px small, so the two read as one control. -->
	<select
		bind:value
		bind:this={ref}
		data-slot="native-select"
		data-size={size}
		class="border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 dark:hover:bg-input/50 enabled:hover:border-foreground/20 focus-visible:border-ring focus-visible:shadow-(--ring-focus) aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-8 w-full min-w-0 appearance-none rounded-lg border bg-transparent py-1 pr-8 pl-2.5 text-sm shadow-field transition-[color,background-color,border-color,box-shadow] duration-[var(--duration-quick)] ease-[var(--ease-smooth-out)] select-none aria-invalid:ring-3 data-[size=sm]:h-7 data-[size=sm]:text-[0.8rem] outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
		{...restProps}
	>
		{@render children?.()}
	</select>
	<CaretDown
		size={16}
		aria-hidden="true"
		data-slot="native-select-icon"
		class="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 select-none"
	/>
</div>
