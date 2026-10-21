<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";

	interface Props extends Omit<HTMLButtonAttributes, "children"> {
		/** No value yet: the label is a prompt and recedes until hovered. */
		empty?: boolean;
		children: Snippet;
	}

	let { empty = false, class: className, children, ...rest }: Props = $props();
</script>

<!-- The one box every property value sits in: 28px, 40 under a coarse pointer. -->
<button
	type="button"
	class={cn(
		"inline-flex h-7 min-w-0 items-center gap-1.5 rounded-md ps-1.5 pe-2.5 text-[13px] whitespace-nowrap outline-none select-none any-pointer-coarse:h-10",
		"transition-colors hover:bg-muted data-[state=open]:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
		"disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
		empty && "text-muted-foreground hover:text-foreground",
		className,
	)}
	{...rest}
>
	{@render children()}
</button>
