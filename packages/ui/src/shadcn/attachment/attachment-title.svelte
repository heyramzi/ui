<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { getAttachmentTitleId } from "#src/shadcn/attachment/context.js";

	let {
		ref = $bindable(null),
		class: className,
		id = getAttachmentTitleId(),
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	{id}
	data-slot="attachment-title"
	class={cn(
		"cn-attachment-title block max-w-full min-w-0 truncate group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer font-medium",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</span>
