<script lang="ts">
	import { Button, type ButtonProps } from "#src/shadcn/button/index.js";
	import { cn } from "#src/lib/utils.js";
	import { getAttachmentTitleId } from "#src/shadcn/attachment/context.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "ghost",
		size = "sm",
		icon = true,
		"aria-label": ariaLabel,
		...restProps
	}: ButtonProps = $props();

	const titleId = getAttachmentTitleId();
</script>

<!-- An unnamed icon action reads "Remove", with the card's title as its description. -->
<Button
	bind:ref
	data-slot="attachment-action"
	{variant}
	{size}
	{icon}
	aria-label={ariaLabel ?? (icon ? "Remove" : undefined)}
	aria-describedby={icon && !ariaLabel ? titleId : undefined}
	class={cn("cn-attachment-action", className)}
	{...restProps}
/>
