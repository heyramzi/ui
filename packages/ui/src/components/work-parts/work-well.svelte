<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Any CSS colour. Tints the well only while something is held over it. */
		hue?: string;
		/** Something is held over the well. */
		active?: boolean;
		children: Snippet;
		class?: string;
	}

	let { hue, active = false, children, class: className, ...rest }: Props = $props();

	// A well rests grey. Its hue shows only while a card is held over it.
	let style = $derived(
		hue && active
			? `background: color-mix(in oklch, ${hue} 8%, var(--color-muted)); outline-color: color-mix(in oklch, ${hue} 30%, transparent);`
			: undefined,
	);
</script>

<!-- The grey well white cards sit in. Card radius plus its padding takes the next step up:
     radius-xl cards, 6px in, a radius-2xl well (DESIGN rule 14). -->
<div
	{...rest}
	class={cn(
		"flex min-h-0 flex-col gap-1.5 overflow-x-hidden overflow-y-auto rounded-2xl bg-muted/70 p-1.5 outline-1 outline-transparent -outline-offset-1 transition-[background-color,outline-color] duration-quick ease-smooth-out dark:bg-muted/60",
		className,
	)}
	{style}
>
	{@render children()}
</div>
