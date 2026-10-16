<script lang="ts">
	import { PinInput as InputOTPPrimitive } from "bits-ui";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		cell,
		class: className,
		...restProps
	}: InputOTPPrimitive.CellProps = $props();
</script>

<InputOTPPrimitive.Cell
	{cell}
	bind:ref
	data-slot="input-otp-slot"
	class={cn(
		"border-input aria-invalid:border-destructive dark:bg-input/30 relative flex size-9 items-center justify-center border-y border-e text-sm transition-[border-color,box-shadow,background-color] outline-none first:rounded-s-md first:border-s last:rounded-e-md",
		cell.isActive &&
			"border-ring ring-ring/50 bg-accent/50 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40 aria-invalid:ring-destructive/20 ring-offset-background z-10 ring-[3px]",
		className,
	)}
	{...restProps}
>
	{cell.char}
</InputOTPPrimitive.Cell>
