<script lang="ts">
	import { Button, type ButtonProps } from "#src/shadcn/button/index.js";
	import { cn } from "@heyramzi/utils";

	let {
		ref = $bindable(null),
		class: className,
		variant = "ghost",
		size = "sm",
		icon = true,
		...restProps
	}: ButtonProps = $props();
</script>

<Button
	bind:ref
	data-slot="attachment-action"
	{variant}
	{size}
	{icon}
	class={cn("cn-attachment-action", className)}
	{...restProps}
/>
