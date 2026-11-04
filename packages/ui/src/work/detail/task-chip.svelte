<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";
	import { buttonVariants } from "#src/shadcn/button/index.js";

	interface Props extends Omit<HTMLButtonAttributes, "children"> {
		/** No value yet: the label is a prompt and recedes until hovered. */
		empty?: boolean;
		children: Snippet;
	}

	let { empty = false, class: className, children, ...rest }: Props = $props();
</script>

<!-- The one box every property value sits in: a quiet ghost Button, 28px, 40 under a coarse pointer. -->
<button
	type="button"
	class={cn(
		buttonVariants({ variant: "ghost", size: "sm" }),
		"min-w-0 justify-start ps-1.5 pe-2.5 text-(length:--text-control) font-normal data-[state=open]:bg-muted",
		empty && "text-muted-foreground hover:text-foreground",
		className,
	)}
	{...rest}
>
	{@render children()}
</button>
