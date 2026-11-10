<script lang="ts">
	import { cn, type WithElementRef } from "#src/lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { getAttachmentTitleId } from "#src/shadcn/attachment/context.js";

	let {
		ref = $bindable(null),
		class: className,
		type = "button",
		child,
		...restProps
	}: WithElementRef<HTMLButtonAttributes> & {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const titleId = getAttachmentTitleId();

	// With no aria-label, the trigger is named by the card's title, since it has no text of its own.
	const mergedProps = $derived({
		class: cn("cn-attachment-trigger absolute inset-0 z-10 outline-none", className),
		"data-slot": "attachment-trigger",
		"aria-labelledby": restProps["aria-label"] ? undefined : titleId,
		...restProps,
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<button bind:this={ref} {type} {...mergedProps}>
		{@render mergedProps.children?.()}
	</button>
{/if}
